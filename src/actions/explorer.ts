import { action, type DialDownEvent, type DialRotateEvent, type DialUpEvent, type TouchTapEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import type { Action } from "@elgato/streamdeck";

import { DIM, GREEN } from "../render";
import {
	albums,
	artistLine,
	artists,
	describeError,
	isScopeError,
	library,
	me,
	player,
	playlists,
	queue,
	recentlyPlayed,
	savedAlbums,
	type AlbumSimple,
	type ListEntry,
	type Track,
} from "../spotify/api";
import { command, store, type PlayerState } from "../spotify/store";
import { PlayerAction } from "./base";
import { t } from "../i18n";

/** A row in the explorer: either a folder you can enter, or something you can play. */
type Item = {
	id: string;
	title: string;
	subtitle?: string;
	/** Track uri or context uri, used to mark what is currently playing. */
	uri?: string;
	/** Present on folders: loads the children shown after entering. */
	open?: () => Promise<Frame>;
	play?: () => Promise<unknown>;
	/** Track / episode uri that a long press adds to the queue. */
	queueUri?: string;
	disabled?: boolean;
};

type Frame = {
	id: string;
	title: string;
	items: Item[];
	cursor: number;
	loading?: boolean;
	error?: string;
	/** The "now playing" frame follows the playing track while idle and reloads on context change. */
	follow?: boolean;
	contextUri?: string;
};

type Nav = { stack: Frame[]; lastTouched: number };

/** Press held at least this long adds the selection to the queue instead of playing it. */
const HOLD_MS = 500;
const TOAST_MS = 1800;

const IDLE_MS = 6000;
const CACHE_MS = 5 * 60_000;
const scopeMsg = () => t("scopeMissing");

// ---------------------------------------------------------------- data → items

const cache = new Map<string, { at: number; value: Promise<Item[]> }>();

/** Memoizes a folder's children for a few minutes so going back and forth is instant. */
function cached(id: string, load: () => Promise<Item[]>): Promise<Item[]> {
	const hit = cache.get(id);
	if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
	const value = load();
	cache.set(id, { at: Date.now(), value });
	value.catch(() => cache.delete(id));
	return value;
}

const folder =
	(id: string, title: string, items: () => Promise<Item[]>, extra: Partial<Frame> = {}) =>
	async (): Promise<Frame> => ({
		id,
		title,
		items: await cached(id, items),
		cursor: 0,
		...extra,
	});

const playAll = (title: string, play: () => Promise<unknown>): Item => ({ id: "play-all", title: `▶ ${title}`, play });

/** Context entries (playlist / album / liked) that play inside their context. */
const contextItems = (entries: ListEntry[], contextUri: string, byUri = false): Item[] =>
	entries.map((e) => ({
		id: `${contextUri}#${e.position}`,
		title: e.title,
		subtitle: e.subtitle,
		uri: e.uri,
		queueUri: e.playable ? e.uri : undefined,
		disabled: !e.playable,
		play: () => player.play({ context_uri: contextUri, offset: byUri ? { uri: e.uri } : { position: e.position } }),
	}));

/** A plain list of tracks played as an ad-hoc queue starting at the chosen one. */
const trackListItems = (tracks: Track[], idPrefix: string): Item[] => {
	const uris = tracks.map((t) => t.uri);
	return tracks.map((t, i) => ({
		id: `${idPrefix}#${i}`,
		title: t.name,
		subtitle: artistLine(t),
		uri: t.uri,
		queueUri: t.is_local ? undefined : t.uri,
		disabled: !!t.is_local,
		play: () => player.play({ uris, offset: { position: i } }),
	}));
};

let userId: Promise<string> | undefined;
const getUserId = () => (userId ??= me.profile().then((p) => p.id));

const albumFolder = (a: AlbumSimple, subtitle?: string): Item => ({
	id: `al:${a.id}`,
	title: a.name,
	subtitle: subtitle ?? [a.album_type === "single" ? t("single") : t("album"), a.release_date?.slice(0, 4)].filter(Boolean).join(" · "),
	uri: a.uri,
	open: folder(`al:${a.id}`, a.name, async () => [
		playAll(t("playAlbum"), () => player.play({ context_uri: a.uri })),
		...contextItems(await albums.entries(a.id), a.uri),
	]),
});

const artistFolder = (id: string, name: string, subtitle?: string): Item => {
	const uri = `spotify:artist:${id}`;
	return {
		id: `ar:${id}`,
		title: name,
		subtitle,
		uri,
		open: folder(`ar:${id}`, name, async () => {
			const list = await artists.albums(id);
			return [
				playAll(t("playArtist"), () => player.play({ context_uri: uri })),
				{
					id: `ar:${id}:top`,
					title: t("topTracks"),
					open: folder(`ar:${id}:top`, t("artistTopTracks", name), async () => trackListItems(await artists.topTracks(id), `ar:${id}:top`)),
				},
				...list.map((a) => albumFolder(a)),
			];
		}),
	};
};

/** Items for whatever context is playing right now. */
async function nowPlayingFrame(): Promise<Frame> {
	const ctx = store.state.playback?.context;
	const base: Frame = { id: "now", title: t("nowPlaying"), items: [], cursor: 0, follow: true, contextUri: ctx?.uri };
	if (!ctx) return { ...base, error: store.state.playback ? t("noContext") : (store.state.error ?? t("notPlaying")) };
	const [, type, id] = ctx.uri.split(":");
	if (type === "playlist") {
		const [name, entries] = await Promise.all([playlists.name(id), playlists.entries(id)]);
		return { ...base, title: name, items: contextItems(entries, ctx.uri) };
	}
	if (type === "album") {
		const [info, entries] = await Promise.all([albums.info(id), albums.entries(id)]);
		return { ...base, title: info.name, items: contextItems(entries, ctx.uri) };
	}
	if (ctx.uri.endsWith(":collection")) {
		return { ...base, title: t("likedSongs"), items: contextItems(await library.likedSongs(), ctx.uri, true) };
	}
	if (type === "artist") {
		const tracks = await artists.topTracks(id);
		return { ...base, title: tracks[0]?.artists?.find((a) => a.id === id)?.name ?? t("artist"), items: trackListItems(tracks, `now:${id}`) };
	}
	return { ...base, error: t("unsupportedContext", type) };
}

function rootFrame(): Frame {
	const items: Item[] = [
		{ id: "now", title: t("nowPlaying"), open: nowPlayingFrame },
		{
			id: "queue",
			title: t("upNext"),
			// Not cached: the queue changes constantly.
			open: async () => {
				const { current, queue: next } = await queue();
				const items: Item[] = next.map((t, i) => ({
					id: `q#${i}`,
					title: t.name,
					subtitle: artistLine(t),
					uri: t.uri,
					// Jumping into the queue = skipping forward to that entry.
					play: async () => {
						for (let n = 0; n <= Math.min(i, 30); n++) await player.next();
					},
				}));
				if (current) items.unshift({ id: "q#now", title: current.name, subtitle: artistLine(current), uri: current.uri });
				return { id: "queue", title: t("queue"), items, cursor: 0, error: items.length ? undefined : t("queueEmpty") };
			},
		},
		{
			id: "playlists",
			title: t("myPlaylists"),
			open: folder("playlists", t("myPlaylists"), async () =>
				(await playlists.mine()).map((p) => ({
					id: `pl:${p.id}`,
					title: p.name,
					subtitle: p.owner.display_name,
					uri: p.uri,
					open: folder(`pl:${p.id}`, p.name, async () => [
						playAll(t("playAll"), () => player.play({ context_uri: p.uri })),
						...contextItems(await playlists.entries(p.id), p.uri),
					]),
				})),
			),
		},
		{
			id: "liked",
			title: t("likedSongs"),
			open: folder("liked", t("likedSongs"), async () => {
				const ctx = `spotify:user:${await getUserId()}:collection`;
				return [playAll(t("playAll"), () => player.play({ context_uri: ctx })), ...contextItems(await library.likedSongs(), ctx, true)];
			}),
		},
		{
			id: "artists",
			title: t("artists"),
			open: async () => {
				const items: Item[] = [];
				const seen = new Set<string>();
				const add = (id: string, name: string, sub?: string) => {
					if (seen.has(id)) return;
					seen.add(id);
					items.push(artistFolder(id, name, sub));
				};
				for (const a of store.state.playback?.item?.artists ?? []) add(a.id, a.name, t("listeningNow"));
				let error: string | undefined;
				const [followed, top] = await Promise.allSettled([artists.followed(), artists.top()]);
				if (followed.status === "fulfilled") followed.value.forEach((a) => add(a.id, a.name, t("following")));
				if (top.status === "fulfilled") top.value.forEach((a) => add(a.id, a.name, t("frequent")));
				const failed = [followed, top].find((r): r is PromiseRejectedResult => r.status === "rejected");
				if (failed) {
					const msg = isScopeError(failed.reason) ? scopeMsg() : describeError(failed.reason);
					if (items.length) items.push({ id: "artists-err", title: msg, disabled: true });
					else error = msg;
				}
				return { id: "artists", title: t("artists"), items, cursor: 0, error };
			},
		},
		{
			id: "albums",
			title: t("savedAlbums"),
			open: folder("albums", t("savedAlbums"), async () => (await savedAlbums()).map((a) => albumFolder(a, a.artists.map((x) => x.name).join(", ")))),
		},
		{
			id: "recent",
			title: t("recent"),
			open: async () => {
				try {
					return { id: "recent", title: t("recent"), items: trackListItems(await recentlyPlayed(), "recent"), cursor: 0 };
				} catch (e) {
					return { id: "recent", title: t("recent"), items: [], cursor: 0, error: isScopeError(e) ? scopeMsg() : describeError(e) };
				}
			},
		},
	];
	return { id: "root", title: t("library"), items, cursor: 0 };
}

// ---------------------------------------------------------------- action

/**
 * Library explorer dial: browse folders (playing now, queue, playlists, liked songs, artists → albums,
 * recently played) on the touch strip. Rotate to scroll, press to enter / play, tap to go back,
 * long touch to jump to the playing track.
 */
@action({ UUID: "com.protomothis.spotify-deck-plus.browse" })
export class ExplorerDial extends PlayerAction {
	protected override marqueeMs = 400;
	private navs = new Map<string, Nav>();
	/** Pending long-press timers per action (press is resolved on release or after HOLD_MS). */
	private holds = new Map<string, NodeJS.Timeout>();
	/** Short confirmation shown on the bottom line, per action. */
	private toasts = new Map<string, { text: string; until: number }>();

	private nav(id: string): Nav {
		let n = this.navs.get(id);
		if (!n) {
			n = { stack: [rootFrame()], lastTouched: 0 };
			this.navs.set(id, n);
			this.push(id, n, nowPlayingFrame, t("nowPlaying"));
		}
		return n;
	}

	/** Pushes a frame, showing a loading placeholder until its items arrive. */
	private push(actionId: string, n: Nav, open: () => Promise<Frame>, title: string): void {
		const placeholder: Frame = { id: "loading", title, items: [], cursor: 0, loading: true };
		n.stack.push(placeholder);
		open()
			.then((f) => {
				const i = n.stack.indexOf(placeholder);
				if (i >= 0) n.stack[i] = f;
			})
			.catch((e) => {
				placeholder.loading = false;
				placeholder.error = isScopeError(e) ? scopeMsg() : describeError(e);
			})
			.finally(() => this.renderId(actionId));
	}

	private renderId(id: string): void {
		for (const a of this.actions) if (a.id === id) void this.render(a, store.state);
	}

	protected render(a: Action<JsonObject>, s: PlayerState) {
		if (!s.loggedIn) {
			return this.feedback(a, { header: "Spotify Deck", pos: "", prev: "", cur: { value: t("notLoggedIn"), color: "#ffffff" }, next: t("loginHint") });
		}
		const n = this.nav(a.id);
		let f = n.stack[n.stack.length - 1];

		// The "now playing" frame reloads when the context changes.
		if (f.follow && !f.loading && f.contextUri !== s.playback?.context?.uri) {
			n.stack.pop();
			this.push(a.id, n, nowPlayingFrame, t("nowPlaying"));
			f = n.stack[n.stack.length - 1];
		}

		const crumbs = n.stack.slice(1).map((x) => x.title);
		const header = this.scroll(a, "header", crumbs.length ? crumbs.slice(-2).join(" › ") : t("library"), 138, 13);
		if (f.loading || !f.items.length) {
			const msg = f.loading ? t("loading") : (f.error ?? t("empty"));
			return this.feedback(a, {
				header,
				pos: "",
				prev: n.stack.length > 1 ? t("tapBack") : "",
				cur: { value: this.scroll(a, "cur", msg, 186, 17), color: f.error ? DIM : "#ffffff" },
				next: "",
			});
		}

		const playingTrack = s.playback?.item?.uri;
		const playingCtx = s.playback?.context?.uri;
		const isNow = (it?: Item) => !!it?.uri && (it.uri === playingTrack || it.uri === playingCtx);
		const nowIdx = f.items.findIndex((it) => isNow(it) && it.uri === playingTrack);
		if (f.follow && nowIdx >= 0 && Date.now() - n.lastTouched > IDLE_MS) f.cursor = nowIdx;
		f.cursor = Math.max(0, Math.min(f.cursor, f.items.length - 1));

		const toast = this.toasts.get(a.id);
		const next = toast && toast.until > Date.now() ? { value: toast.text, color: GREEN } : undefined;

		const label = (it?: Item) => (it ? `${isNow(it) ? "▶ " : ""}${it.title}${it.subtitle ? ` · ${it.subtitle}` : ""}${it.open ? "  ›" : ""}` : "");
		const cur = f.items[f.cursor];
		return this.feedback(a, {
			header,
			pos: `${f.cursor + 1}/${f.items.length}`,
			prev: label(f.items[f.cursor - 1]),
			cur: { value: this.scroll(a, "cur", label(cur), 186, 17), color: isNow(cur) ? GREEN : cur.disabled ? DIM : "#ffffff" },
			next: next ?? { value: label(f.items[f.cursor + 1]), color: "#7a7a7a" },
		});
	}

	override onDialRotate(ev: DialRotateEvent): void {
		const n = this.nav(ev.action.id);
		const f = n.stack[n.stack.length - 1];
		if (!f.items.length) return;
		f.cursor = Math.max(0, Math.min(f.items.length - 1, f.cursor + ev.payload.ticks));
		n.lastTouched = Date.now();
		void this.render(ev.action, store.state);
	}

	/** Press starts a hold timer: held → add to queue, released early → normal press. */
	override onDialDown(ev: DialDownEvent): void {
		clearTimeout(this.holds.get(ev.action.id));
		this.holds.set(
			ev.action.id,
			setTimeout(() => {
				this.holds.delete(ev.action.id);
				void this.enqueue(ev.action);
			}, HOLD_MS),
		);
	}

	override async onDialUp(ev: DialUpEvent): Promise<void> {
		const timer = this.holds.get(ev.action.id);
		if (!timer) return; // already handled as a long press
		clearTimeout(timer);
		this.holds.delete(ev.action.id);
		await this.press(ev.action);
	}

	/** Long press: add the selected track to the queue. */
	private async enqueue(a: DialDownEvent["action"]): Promise<void> {
		const n = this.nav(a.id);
		const f = n.stack[n.stack.length - 1];
		const uri = f.items[f.cursor]?.queueUri;
		if (!uri || f.loading) return void a.showAlert();
		n.lastTouched = Date.now();
		if (
			await command(
				() => player.queue(uri),
				() => void a.showAlert(),
			)
		) {
			this.toasts.set(a.id, { text: t("addedToQueue"), until: Date.now() + TOAST_MS });
			void this.render(a, store.state);
			setTimeout(() => this.renderId(a.id), TOAST_MS + 50);
		}
	}

	/** Short press: enter a folder, or play the selected item. */
	private async press(action: DialDownEvent["action"]): Promise<void> {
		const ev = { action };
		const n = this.nav(ev.action.id);
		const f = n.stack[n.stack.length - 1];
		const it = f.items[f.cursor];
		if (!it || it.disabled || f.loading) return void ev.action.showAlert();
		n.lastTouched = Date.now();
		if (it.open) {
			this.push(ev.action.id, n, it.open, it.title);
			return void this.render(ev.action, store.state);
		}
		if (it.play) {
			n.lastTouched = 0;
			await command(it.play, () => void ev.action.showAlert());
		}
	}

	/** Tap: go up one level. Long touch: jump to the playing track. */
	override onTouchTap(ev: TouchTapEvent): void {
		const n = this.nav(ev.action.id);
		if (ev.payload.hold) {
			n.stack = [rootFrame()];
			n.lastTouched = 0;
			this.push(ev.action.id, n, nowPlayingFrame, t("nowPlaying"));
		} else if (n.stack.length > 1) {
			n.stack.pop();
			n.lastTouched = Date.now();
		}
		void this.render(ev.action, store.state);
	}
}
