import type { JsonObject } from "@elgato/utils";
import streamDeck, { action, type Action, type DidReceiveSettingsEvent, type KeyDownEvent } from "@elgato/streamdeck";

import { DIM, fetchArt, glyph, GREEN, keyImage } from "../render";
import { artUrl, player, playlists, library } from "../spotify/api";
import { getServerError, SETTINGS_URL } from "../server";
import { store, type PlayerState } from "../spotify/store";
import { PlayerAction } from "./base";
import { t } from "../i18n";

@action({ UUID: "com.protomothis.spotify-deck-plus.play-pause" })
export class PlayPauseKey extends PlayerAction {
	protected async render(a: Action<JsonObject>, s: PlayerState): Promise<void> {
		const playing = !!s.playback?.is_playing;
		const g = playing ? glyph.pause : glyph.play;
		const url = artUrl(s.playback?.item, 300);
		// Draw immediately without art, then again once the art has loaded.
		const art = url ? await fetchArt(url) : undefined;
		await this.image(a, keyImage({ glyph: g, art, color: s.loggedIn ? "#ffffff" : DIM }));
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const playing = !!store.state.playback?.is_playing;
		if (store.state.playback) store.patch((s) => (s.playback!.is_playing = !playing));
		await this.run(ev.action, () => (playing ? player.pause() : player.play()));
	}
}

@action({ UUID: "com.protomothis.spotify-deck-plus.previous" })
export class PreviousKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		return this.image(a, keyImage({ glyph: glyph.prev, color: s.playback ? "#ffffff" : DIM }));
	}
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await this.run(ev.action, () => player.previous());
	}
}

@action({ UUID: "com.protomothis.spotify-deck-plus.next" })
export class NextKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		return this.image(a, keyImage({ glyph: glyph.next, color: s.playback ? "#ffffff" : DIM }));
	}
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await this.run(ev.action, () => player.next());
	}
}

@action({ UUID: "com.protomothis.spotify-deck-plus.like" })
export class LikeKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		const liked = !!s.liked;
		return this.image(a, keyImage({ glyph: liked ? glyph.heart : glyph.heartOutline, color: liked ? GREEN : s.playback ? "#ffffff" : DIM }));
	}
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const track = store.state.playback?.item;
		if (!track || store.state.playback?.currently_playing_type !== "track") return void ev.action.showAlert();
		const next = !store.state.liked;
		store.patch((s) => (s.liked = next));
		void this.pop(ev.action, next);
		const ok = await this.run(ev.action, () => library.setSaved(track, next));
		if (!ok) store.patch((s) => (s.liked = !next));
	}

	/** A quick "pop" of the heart: grows, overshoots back, settles. */
	private async pop(a: KeyDownEvent["action"], liked: boolean): Promise<void> {
		const g = liked ? glyph.heart : glyph.heartOutline;
		const color = liked ? GREEN : "#ffffff";
		for (const scale of liked ? [1.25, 1.4, 1.15, 0.95, 1] : [0.8, 0.7, 0.9, 1]) {
			await a.setImage(keyImage({ glyph: g, color, scale }));
			await new Promise((r) => setTimeout(r, 45));
		}
	}
}

@action({ UUID: "com.protomothis.spotify-deck-plus.shuffle" })
export class ShuffleKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		const on = !!s.playback?.shuffle_state;
		return this.image(a, keyImage({ glyph: glyph.shuffle, color: on ? GREEN : s.playback ? "#ffffff" : DIM, label: on ? t("shuffleOn") : t("shuffleOff") }));
	}
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const pb = store.state.playback;
		if (!pb) return void ev.action.showAlert();
		const next = !pb.shuffle_state;
		store.patch(() => (pb.shuffle_state = next));
		await this.run(ev.action, () => player.shuffle(next));
	}
}

const REPEAT_ORDER = ["off", "context", "track"] as const;
const REPEAT_LABEL = { off: "repeatOff", context: "repeatAll", track: "repeatOne" } as const;

@action({ UUID: "com.protomothis.spotify-deck-plus.repeat" })
export class RepeatKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		const mode = s.playback?.repeat_state ?? "off";
		return this.image(
			a,
			keyImage({
				glyph: glyph.repeat,
				color: mode !== "off" ? GREEN : s.playback ? "#ffffff" : DIM,
				badge: mode === "track" ? "1" : undefined,
				label: t(REPEAT_LABEL[mode]),
			}),
		);
	}
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const pb = store.state.playback;
		if (!pb) return void ev.action.showAlert();
		const next = REPEAT_ORDER[(REPEAT_ORDER.indexOf(pb.repeat_state) + 1) % REPEAT_ORDER.length];
		store.patch(() => (pb.repeat_state = next));
		await this.run(ev.action, () => player.repeat(next));
	}
}

export type AddToPlaylistSettings = { playlistId?: string; playlistName?: string };

@action({ UUID: "com.protomothis.spotify-deck-plus.add-to-playlist" })
export class AddToPlaylistKey extends PlayerAction<AddToPlaylistSettings> {
	private names = new Map<string, string | undefined>();

	protected async render(a: Action<AddToPlaylistSettings>, s: PlayerState): Promise<void> {
		if (!this.names.has(a.id)) this.names.set(a.id, (await a.getSettings()).playlistName);
		const name = this.names.get(a.id);
		await this.image(a, keyImage({ glyph: glyph.playlistAdd, color: name && s.playback ? "#ffffff" : DIM, label: name ?? t("needsSetup") }));
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<AddToPlaylistSettings>): void {
		this.names.set(ev.action.id, ev.payload.settings.playlistName);
		void this.render(ev.action, store.state);
	}

	override async onKeyDown(ev: KeyDownEvent<AddToPlaylistSettings>): Promise<void> {
		const { playlistId } = ev.payload.settings;
		const track = store.state.playback?.item;
		if (!playlistId || !track) return void ev.action.showAlert();
		if (await this.run(ev.action, () => playlists.add(playlistId, track.uri))) await ev.action.showOk();
	}
}

@action({ UUID: "com.protomothis.spotify-deck-plus.device" })
export class DeviceKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		const name = s.playback?.device?.name;
		return this.image(a, keyImage({ glyph: glyph.speaker, color: name ? "#ffffff" : DIM, label: name ?? t("noDevice") }));
	}

	/** Moves playback to the next available device (cycling). */
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await this.run(ev.action, async () => {
			const devices = (await player.devices()).filter((d) => d.id);
			if (!devices.length) throw new Error(t("noDevice"));
			const i = devices.findIndex((d) => d.is_active);
			const target = devices[(i + 1) % devices.length];
			const wasPlaying = !!store.state.playback?.is_playing;
			store.patch((s) => {
				if (s.playback) s.playback.device = target;
			});
			// Keep the current state: a paused session stays paused on the new device.
			await player.transfer(target.id!, wasPlaying);
		});
	}
}

/** Opens the local settings page (login, status) in the browser. */
@action({ UUID: "com.protomothis.spotify-deck-plus.setup" })
export class SetupKey extends PlayerAction {
	protected render(a: Action<JsonObject>, s: PlayerState) {
		const err = getServerError();
		if (err) return this.image(a, keyImage({ glyph: glyph.spotify, color: "#f15e6c", label: err }));
		return this.image(a, keyImage({ glyph: glyph.spotify, color: s.loggedIn ? GREEN : "#ffffff", label: s.loggedIn ? t("connected") : t("settings") }));
	}
	override async onKeyDown(): Promise<void> {
		await streamDeck.system.openUrl(SETTINGS_URL);
	}
}
