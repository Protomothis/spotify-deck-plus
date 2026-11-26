import type { JsonObject } from "@elgato/utils";
import { action, type Action, type DialDownEvent, type DialRotateEvent, type TouchTapEvent } from "@elgato/streamdeck";

import { DIM, fetchArt, fmtTime, glyph, GREEN, iconSvg } from "../render";
import { artistLine, artUrl, library, me, player, playlists, type ListEntry } from "../spotify/api";
import { command, store, type PlayerState } from "../spotify/store";
import { PlayerAction } from "./base";
import { t as tr } from "../i18n";
import { SEEK_STEPS, stepSetting, VOLUME_STEPS, type DialSettings } from "../settings";

const alert = (a: Action<JsonObject>) => () => void (a.isDial() && a.showAlert());

// ---------------------------------------------------------------- Playback

@action({ UUID: "com.protomothis.spotify-deck-plus.playback-dial" })
export class PlaybackDial extends PlayerAction {
	protected override marqueeMs = 400;
	private seekTarget?: number;
	private seekTimer?: NodeJS.Timeout;

	protected async render(a: Action<JsonObject>, s: PlayerState): Promise<void> {
		const pb = s.playback;
		const t = pb?.item;
		if (!t) {
			await this.feedback(a, { art: iconSvg(glyph.spotify, DIM), title: s.error ?? tr("notPlaying"), artist: "", progress: 0, elapsed: "", remaining: "" });
			return;
		}
		const dur = t.duration_ms || 1;
		const pos = this.seekTarget ?? store.progress();
		const art = (await fetchArt(artUrl(t, 64))) ?? iconSvg(glyph.spotify, GREEN);
		await this.feedback(a, {
			art,
			title: { value: this.scroll(a, "title", t.name, 130, 15), color: pb!.is_playing ? "#ffffff" : DIM },
			artist: this.scroll(a, "artist", artistLine(t), 130, 12),
			progress: { value: Math.round((pos / dur) * 100), bar_fill_c: pb!.is_playing ? GREEN : DIM },
			elapsed: fmtTime(pos),
			remaining: `-${fmtTime(dur - pos)}`,
		});
	}

	/** Rotate: seek `seekStep` seconds per tick (debounced so fast spins send one request). */
	override onDialRotate(ev: DialRotateEvent<DialSettings>): void {
		const t = store.state.playback?.item;
		if (!t) return;
		const step = stepSetting(ev.payload.settings.seekStep, SEEK_STEPS, 5) * 1000;
		this.seekTarget = Math.max(0, Math.min(t.duration_ms - 1000, (this.seekTarget ?? store.progress()) + ev.payload.ticks * step));
		this.renderAll();
		clearTimeout(this.seekTimer);
		this.seekTimer = setTimeout(async () => {
			const target = this.seekTarget!;
			await command(() => player.seek(target), alert(ev.action));
			store.patch((s) => {
				if (s.playback) s.playback.progress_ms = target;
				s.fetchedAt = Date.now();
			});
			this.seekTarget = undefined;
		}, 350);
	}

	/** Press: play / pause. */
	override async onDialDown(ev: DialDownEvent): Promise<void> {
		const playing = !!store.state.playback?.is_playing;
		if (store.state.playback) store.patch((s) => (s.playback!.is_playing = !playing));
		await command(() => (playing ? player.pause() : player.play()), alert(ev.action));
	}

	/** Tap: next track. Long touch: previous track. */
	override async onTouchTap(ev: TouchTapEvent): Promise<void> {
		await command(() => (ev.payload.hold ? player.previous() : player.next()), alert(ev.action));
	}
}

// ---------------------------------------------------------------- Volume

@action({ UUID: "com.protomothis.spotify-deck-plus.volume-dial" })
export class VolumeDial extends PlayerAction {
	protected override marqueeMs = 400;
	/** Volume the user dialed in; shown instead of Spotify's (lagging) value until it settles. */
	private pending?: number;
	private sending = false;
	private release?: NodeJS.Timeout;
	private beforeMute?: number;

	private current(): number | undefined {
		return this.pending ?? store.state.playback?.device?.volume_percent ?? undefined;
	}

	protected render(a: Action<JsonObject>, s: PlayerState) {
		const vol = this.current();
		const device = s.playback?.device?.name;
		if (vol === undefined) {
			return this.feedback(a, { title: device ?? tr("volume"), icon: iconSvg(glyph.volume, DIM), value: "—", indicator: 0 });
		}
		const muted = vol === 0;
		return this.feedback(a, {
			title: this.scroll(a, "title", device ?? tr("volume"), 184, 13),
			icon: iconSvg(muted ? glyph.mute : glyph.volume, muted ? DIM : "#ffffff"),
			value: `${vol}%`,
			indicator: { value: vol, bar_fill_c: muted ? DIM : GREEN },
		});
	}

	private set(vol: number, a: Action<JsonObject>): void {
		this.pending = Math.max(0, Math.min(100, Math.round(vol)));
		clearTimeout(this.release);
		this.renderAll();
		void this.flush(a);
	}

	/**
	 * Sends the latest dialed volume, one request at a time; values dialed while a request is in
	 * flight are coalesced into the next one.
	 */
	private async flush(a: Action<JsonObject>): Promise<void> {
		if (this.sending) return;
		this.sending = true;
		let sent: number | undefined;
		try {
			while (this.pending !== undefined && this.pending !== sent) {
				const v = this.pending;
				if (!(await command(() => player.volume(v)))) {
					if (a.isDial()) await a.showAlert();
					break;
				}
				sent = v;
				store.patch((s) => {
					if (s.playback?.device) s.playback.device.volume_percent = v;
				});
				await new Promise((r) => setTimeout(r, 120));
			}
		} finally {
			this.sending = false;
		}
		// Spotify reports the old level for a moment; keep showing ours until it catches up.
		clearTimeout(this.release);
		this.release = setTimeout(() => {
			if (this.sending) return;
			this.pending = undefined;
			this.renderAll();
		}, 2000);
	}

	/** Rotate: ±`volumeStep` % per tick. */
	override onDialRotate(ev: DialRotateEvent<DialSettings>): void {
		const vol = this.current();
		if (vol === undefined) return void ev.action.showAlert();
		this.set(vol + ev.payload.ticks * stepSetting(ev.payload.settings.volumeStep, VOLUME_STEPS, 2), ev.action);
	}

	/** Press / tap: mute toggle (restores the previous level). */
	override onDialDown(ev: DialDownEvent): void {
		this.toggleMute(ev.action);
	}
	override onTouchTap(ev: TouchTapEvent): void {
		this.toggleMute(ev.action);
	}

	private toggleMute(a: Action<JsonObject>): void {
		const vol = this.current();
		if (vol === undefined) return void (a.isDial() && a.showAlert());
		if (vol > 0) {
			this.beforeMute = vol;
			this.set(0, a);
		} else {
			this.set(this.beforeMute || 30, a);
		}
	}
}

// ---------------------------------------------------------------- List dials

type ListData = { key?: string; header: string; entries: ListEntry[]; loadedAt: number; loading?: Promise<void>; error?: string };
type Cursor = { index: number; lastTouched: number };

const BROWSE_IDLE_MS = 6000;

/**
 * A dial that shows a scrollable list on the touch strip (previous / selected / next), follows
 * the currently playing entry while idle, and plays the selected entry on press.
 */
abstract class ListDial extends PlayerAction {
	protected override marqueeMs = 400;
	protected data: ListData = { header: "", entries: [], loadedAt: 0 };
	private cursors = new Map<string, Cursor>();

	/** Identity of the list to show for this state (undefined = nothing to show). */
	protected abstract listKey(s: PlayerState): string | undefined;
	protected abstract load(key: string, s: PlayerState): Promise<{ header: string; entries: ListEntry[] }>;
	protected abstract nowIndex(entries: ListEntry[], s: PlayerState): number;
	protected abstract play(entry: ListEntry, key: string, s: PlayerState): Promise<unknown>;
	protected abstract emptyText(s: PlayerState): string;
	/** Cache lifetime for a loaded list. */
	protected ttl = 5 * 60_000;

	private cursor(id: string): Cursor {
		let c = this.cursors.get(id);
		if (!c) this.cursors.set(id, (c = { index: -1, lastTouched: 0 }));
		return c;
	}

	private ensureLoaded(s: PlayerState, force = false): void {
		const key = this.listKey(s);
		if (!key) {
			this.data = { header: "", entries: [], loadedAt: 0 };
			return;
		}
		const fresh = this.data.key === key && Date.now() - this.data.loadedAt < this.ttl;
		if ((fresh && !force) || this.data.loading) return;
		const keyChanged = this.data.key !== key;
		this.data = { ...this.data, key, ...(keyChanged ? { header: tr("loading"), entries: [] } : {}) };
		this.data.loading = this.load(key, s)
			.then(({ header, entries }) => {
				if (this.data.key !== key) return;
				this.data = { key, header, entries, loadedAt: Date.now() };
				if (keyChanged) for (const c of this.cursors.values()) c.lastTouched = 0;
			})
			.catch((e) => {
				this.data = { key, header: tr("loadFailed"), entries: [], loadedAt: Date.now(), error: (e as Error).message };
			})
			.finally(() => this.renderAll());
	}

	protected render(a: Action<JsonObject>, s: PlayerState) {
		if (!s.loggedIn) return this.feedback(a, lines("Spotify Deck", "", "", tr("notLoggedIn"), tr("loginHint")));
		this.ensureLoaded(s);
		const { entries, header } = this.data;
		if (!entries.length) {
			return this.feedback(a, lines(header || "Spotify", "", "", this.data.loading ? tr("loading") : (this.data.error ?? this.emptyText(s)), ""));
		}
		const now = this.nowIndex(entries, s);
		const c = this.cursor(a.id);
		if (c.index < 0 || Date.now() - c.lastTouched > BROWSE_IDLE_MS) c.index = now >= 0 ? now : Math.max(0, c.index);
		c.index = Math.min(c.index, entries.length - 1);
		const label = (i: number) => {
			const e = entries[i];
			if (!e) return "";
			return `${i === now ? "▶ " : ""}${e.title}${e.subtitle ? ` · ${e.subtitle}` : ""}`;
		};
		const sel = entries[c.index];
		return this.feedback(a, {
			header: this.scroll(a, "header", header, 138, 13),
			pos: `${c.index + 1}/${entries.length}`,
			prev: label(c.index - 1),
			cur: { value: this.scroll(a, "cur", label(c.index), 186, 17), color: c.index === now ? GREEN : sel.playable ? "#ffffff" : DIM },
			next: label(c.index + 1),
		});
	}

	override onDialRotate(ev: DialRotateEvent): void {
		if (!this.data.entries.length) return;
		const c = this.cursor(ev.action.id);
		c.index = Math.max(0, Math.min(this.data.entries.length - 1, c.index + ev.payload.ticks));
		c.lastTouched = Date.now();
		void this.render(ev.action, store.state);
	}

	override async onDialDown(ev: DialDownEvent): Promise<void> {
		const c = this.cursor(ev.action.id);
		const entry = this.data.entries[c.index];
		const key = this.data.key;
		if (!entry || !key || !entry.playable) return void ev.action.showAlert();
		c.lastTouched = 0;
		await command(() => this.play(entry, key, store.state), alert(ev.action));
	}

	/** Tap: jump back to the playing entry. Long touch: reload the list. */
	override onTouchTap(ev: TouchTapEvent): void {
		this.cursor(ev.action.id).lastTouched = 0;
		if (ev.payload.hold) this.ensureLoaded(store.state, true);
		void this.render(ev.action, store.state);
	}
}

const lines = (header: string, pos: string, prev: string, cur: string, next: string) => ({ header, pos, prev, cur: { value: cur, color: "#ffffff" }, next });

/** The user's playlists. */
@action({ UUID: "com.protomothis.spotify-deck-plus.playlists-dial" })
export class PlaylistsDial extends ListDial {
	protected listKey() {
		return "mine";
	}
	protected async load() {
		const list = await playlists.mine();
		return {
			header: tr("myPlaylists"),
			entries: list.map((p, i) => ({ uri: p.uri, title: p.name, subtitle: p.owner.display_name ?? "", position: i, playable: true })),
		};
	}
	protected nowIndex(entries: ListEntry[], s: PlayerState) {
		const ctx = s.playback?.context?.uri;
		return ctx ? entries.findIndex((e) => e.uri === ctx) : -1;
	}
	protected play(entry: ListEntry) {
		return player.play({ context_uri: entry.uri });
	}
	protected emptyText() {
		return tr("noPlaylists");
	}
}

/** Liked Songs. */
@action({ UUID: "com.protomothis.spotify-deck-plus.liked-dial" })
export class LikedSongsDial extends ListDial {
	private userId?: string;

	protected listKey() {
		return "liked";
	}
	protected async load() {
		this.userId ??= (await me.profile()).id;
		return { header: tr("likedSongs"), entries: await library.likedSongs() };
	}
	protected nowIndex(entries: ListEntry[], s: PlayerState) {
		const uri = s.playback?.item?.uri;
		return uri ? entries.findIndex((e) => e.uri === uri) : -1;
	}
	protected play(entry: ListEntry) {
		return player.play({ context_uri: `spotify:user:${this.userId}:collection`, offset: { uri: entry.uri } });
	}
	protected emptyText() {
		return tr("noLiked");
	}
}
