import streamDeck from "@elgato/streamdeck";
import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

import { getAccessToken } from "./auth";
import { t as tr } from "../i18n";

const BASE = "https://api.spotify.com/v1";

export class SpotifyError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly reason?: string,
	) {
		super(message);
	}
}

/** Human readable message for errors shown on the device. */
export function describeError(e: unknown): string {
	if (e instanceof SpotifyError) {
		if (e.reason === "NO_ACTIVE_DEVICE" || e.status === 404) return tr("noActiveDevice");
		if (e.reason === "PREMIUM_REQUIRED") return tr("premiumRequired");
		if (e.reason === "VOLUME_CONTROL_DISALLOW") return tr("volumeDisallowed");
		if (e.status === 403) return tr("forbidden");
		if (e.status === 429) return tr("rateLimited");
		return tr("error", e.status);
	}
	return (e as Error)?.message ?? String(e);
}

type Init = { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined> };

/** Low-level request with token refresh on 401 and a single retry on 429. */
export async function request<T = unknown>(path: string, init: Init = {}, attempt = 0): Promise<T> {
	const url = new URL(path.startsWith("http") ? path : BASE + path);
	for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));

	const token = await getAccessToken(attempt > 0);
	const res = await fetch(url, {
		method: init.method ?? "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
		},
		body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
	});

	if (res.status === 401 && attempt === 0) return request<T>(path, init, 1);
	if (res.status === 429 && attempt < 2) {
		const wait = Math.min(Number(res.headers.get("Retry-After") ?? 1), 10) * 1000;
		await new Promise((r) => setTimeout(r, wait));
		return request<T>(path, init, attempt + 1);
	}
	if (res.status === 204) return undefined as T;

	const text = await res.text();
	if (!res.ok) {
		let message = text;
		let reason: string | undefined;
		try {
			const j = JSON.parse(text) as { error?: { message?: string; reason?: string } };
			message = j.error?.message ?? text;
			reason = j.error?.reason;
		} catch {
			/* not json */
		}
		streamDeck.logger.warn(`Spotify ${init.method ?? "GET"} ${url.pathname} -> ${res.status} ${message}`);
		throw new SpotifyError(res.status, message, reason);
	}
	if (!text) return undefined as T;
	try {
		return JSON.parse(text) as T;
	} catch {
		// Some player endpoints answer 200 with a bare non-JSON body; treat it as "no content".
		return undefined as T;
	}
}

// ---------- Types (only the fields we use) ----------

export type Image = { url: string; width?: number | null; height?: number | null };
export type Artist = { id: string; name: string };
export type Track = {
	id: string | null;
	uri: string;
	name: string;
	duration_ms: number;
	is_local?: boolean;
	artists?: Artist[];
	album?: { name: string; images: Image[] };
	/** Episodes */
	show?: { name: string; images: Image[] };
	images?: Image[];
};
export type Device = { id: string | null; name: string; type: string; is_active: boolean; volume_percent: number | null; supports_volume?: boolean; is_restricted?: boolean };
export type Context = { type: string; uri: string } | null;
export type Playback = {
	device: Device;
	is_playing: boolean;
	progress_ms: number | null;
	shuffle_state: boolean;
	repeat_state: "off" | "context" | "track";
	context: Context;
	item: Track | null;
	currently_playing_type: string;
};
export type Playlist = { id: string; uri: string; name: string; owner: { id: string; display_name?: string }; collaborative: boolean; images?: Image[] | null };

export type ListEntry = {
	/** Track/playlist uri. */
	uri: string;
	title: string;
	subtitle: string;
	/** Position inside the context (for offset playback). */
	position: number;
	playable: boolean;
};

type Page<T> = { items: T[]; next: string | null; total: number };

async function paginate<T>(first: string, query: Record<string, string | number>, max: number): Promise<{ items: T[]; total: number }> {
	const items: T[] = [];
	let page = await request<Page<T>>(first, { query });
	items.push(...page.items);
	while (page.next && items.length < max) {
		page = await request<Page<T>>(page.next);
		items.push(...page.items);
	}
	return { items: items.slice(0, max), total: page.total };
}

export const artistLine = (t: Track | null | undefined) => t?.artists?.map((a) => a.name).join(", ") ?? t?.show?.name ?? "";
export const artUrl = (t: Track | null | undefined, prefer = 300): string | undefined => {
	const imgs = t?.album?.images ?? t?.images ?? t?.show?.images ?? [];
	if (!imgs.length) return undefined;
	return [...imgs].sort((a, b) => Math.abs((a.width ?? prefer) - prefer) - Math.abs((b.width ?? prefer) - prefer))[0].url;
};
export const idFromUri = (uri: string) => uri.split(":").pop()!;

// ---------- Player ----------

const run = promisify(execFile);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isNoDevice = (e: unknown) => e instanceof SpotifyError && (e.reason === "NO_ACTIVE_DEVICE" || e.status === 404);

let statusListener: ((msg: string | undefined) => void) | undefined;
/** Receives progress text while the local Spotify app is being started (undefined = done). */
export const onDeviceStatus = (fn: typeof statusListener) => void (statusListener = fn);

let computerName: Promise<string> | undefined;
/** Spotify Connect names the desktop app after the macOS computer name. */
const localName = () =>
	(computerName ??= run("/usr/sbin/scutil", ["--get", "ComputerName"]).then(
		(r) => r.stdout.trim(),
		() => os.hostname().replace(/\.local$/, ""),
	));

const spotifyRunning = () => run("/usr/bin/pgrep", ["-x", "Spotify"]).then(() => true, () => false);

async function findLocal(acceptAnyComputer: boolean): Promise<Device | undefined> {
	const devices = (await request<{ devices: Device[] }>("/me/player/devices")).devices.filter((d) => d.id && !d.is_restricted);
	const name = (await localName()).normalize("NFC").toLowerCase();
	return (
		devices.find((d) => d.type === "Computer" && d.name.normalize("NFC").toLowerCase() === name) ??
		(acceptAnyComputer ? devices.find((d) => d.type === "Computer") : undefined)
	);
}

let activating: Promise<string> | undefined;

/**
 * Makes this Mac's Spotify app the active Connect device, launching it in the background when it
 * isn't running. Returns the device id.
 */
export function activateLocalDevice(): Promise<string> {
	return (activating ??= (async () => {
		let device = await findLocal(false);
		if (!device) {
			if (!(await spotifyRunning())) {
				statusListener?.(tr("openingSpotify"));
				streamDeck.logger.info("no active device; launching Spotify");
				await run("/usr/bin/open", ["-g", "-a", "Spotify"]);
			} else {
				statusListener?.(tr("connectingSpotify"));
			}
			// A freshly launched app needs a few seconds before it registers with Spotify Connect, and an
			// idle app can drop off Connect entirely. If it stays invisible, poke it via AppleScript:
			// starting local playback makes it re-register.
			for (let i = 0; i < 25 && !device; i++) {
				await sleep(1000);
				if (i === 5) {
					streamDeck.logger.info("local Spotify not on Connect; nudging via AppleScript");
					await run("/usr/bin/osascript", ["-e", 'tell application "Spotify" to play']).catch((e) =>
						streamDeck.logger.warn(`AppleScript nudge failed: ${(e as Error).message}`),
					);
				}
				device = await findLocal(i >= 10);
			}
		}
		if (!device?.id) throw new SpotifyError(404, "local Spotify not found", "NO_ACTIVE_DEVICE");
		await request("/me/player", { method: "PUT", body: { device_ids: [device.id], play: false } });
		streamDeck.logger.info(`activated local device ${device.name}`);
		return device.id;
	})().finally(() => {
		activating = undefined;
		statusListener?.(undefined);
	}));
}

let lastAdopt = 0;

/**
 * When nothing is playing anywhere but this Mac's Spotify is open, quietly make it the active
 * device (paused) so the deck shows its state and the next press works instantly.
 */
export async function adoptLocalDevice(): Promise<boolean> {
	if (activating || Date.now() - lastAdopt < 30_000) return false;
	lastAdopt = Date.now();
	if (!(await spotifyRunning())) return false;
	const device = await findLocal(false);
	if (!device?.id || device.is_active) return false;
	await request("/me/player", { method: "PUT", body: { device_ids: [device.id], play: false } });
	streamDeck.logger.info(`adopted idle local device ${device.name}`);
	return true;
}

/** Runs a player command; when no device is active, activates the local app and retries. */
async function withDevice<T>(fn: (deviceId?: string) => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		if (!isNoDevice(e)) throw e;
	}
	const id = await activateLocalDevice();
	// The transfer can take a moment to settle on Spotify's side.
	for (let i = 0; ; i++) {
		try {
			return await fn(id);
		} catch (e) {
			if (!isNoDevice(e) || i >= 3) throw e;
			await sleep(700);
		}
	}
}

type PlayBody = { context_uri?: string; uris?: string[]; offset?: { position: number } | { uri: string } };

export const player = {
	get: () => request<Playback | undefined>("/me/player", { query: { additional_types: "track,episode" } }),
	devices: async () => (await request<{ devices: Device[] }>("/me/player/devices")).devices,
	play: (body?: PlayBody, deviceId?: string) =>
		withDevice((fallback) => request("/me/player/play", { method: "PUT", body: body ?? undefined, query: { device_id: deviceId ?? fallback } })),
	pause: () => request("/me/player/pause", { method: "PUT" }),
	next: () => withDevice(() => request("/me/player/next", { method: "POST" })),
	previous: () => withDevice(() => request("/me/player/previous", { method: "POST" })),
	seek: (ms: number) => withDevice(() => request("/me/player/seek", { method: "PUT", query: { position_ms: Math.max(0, Math.round(ms)) } })),
	volume: (pct: number) =>
		withDevice(() => request("/me/player/volume", { method: "PUT", query: { volume_percent: Math.max(0, Math.min(100, Math.round(pct))) } })),
	shuffle: (on: boolean) => withDevice(() => request("/me/player/shuffle", { method: "PUT", query: { state: on } })),
	repeat: (mode: "off" | "context" | "track") => withDevice(() => request("/me/player/repeat", { method: "PUT", query: { state: mode } })),
	transfer: (deviceId: string, play = false) => request("/me/player", { method: "PUT", body: { device_ids: [deviceId], play } }),
};

// ---------- Library ----------
// Spotify has been migrating library endpoints; try the classic ones first and fall back to the
// generic /me/library endpoints when they are gone.

const isGone = (e: unknown) => e instanceof SpotifyError && (e.status === 404 || e.status === 410);

export const library = {
	async isSaved(track: Track): Promise<boolean> {
		if (!track.id) return false;
		try {
			return (await request<boolean[]>("/me/tracks/contains", { query: { ids: track.id } }))[0] ?? false;
		} catch (e) {
			if (!isGone(e)) throw e;
			return (await request<boolean[]>("/me/library/contains", { query: { uris: track.uri } }))[0] ?? false;
		}
	},
	async setSaved(track: Track, saved: boolean): Promise<void> {
		if (!track.id) return;
		try {
			await request("/me/tracks", { method: saved ? "PUT" : "DELETE", query: { ids: track.id } });
		} catch (e) {
			if (!isGone(e)) throw e;
			await request("/me/library", { method: saved ? "PUT" : "DELETE", query: { uris: track.uri } });
		}
	},
	async likedSongs(max = 500): Promise<ListEntry[]> {
		const { items } = await paginate<{ track: Track | null }>("/me/tracks", { limit: 50 }, max);
		return items.flatMap((it, i) =>
			it.track ? [{ uri: it.track.uri, title: it.track.name, subtitle: artistLine(it.track), position: i, playable: !it.track.is_local }] : [],
		);
	},
};

export const me = {
	profile: () => request<{ id: string; display_name: string | null; product?: string }>("/me"),
};

// ---------- Playlists ----------

export const playlists = {
	async mine(max = 300): Promise<Playlist[]> {
		return (await paginate<Playlist | null>("/me/playlists", { limit: 50 }, max)).items.filter((p): p is Playlist => !!p);
	},
	async name(id: string): Promise<string> {
		return (await request<{ name: string }>(`/playlists/${id}`, { query: { fields: "name" } })).name;
	},
	/** Playlist entries. Newer API uses /items with `item`, older /tracks with `track`. */
	async entries(id: string, max = 1000): Promise<ListEntry[]> {
		type Row = { item?: Track | null; track?: Track | null };
		let rows: Row[];
		try {
			rows = (await paginate<Row>(`/playlists/${id}/items`, { limit: 50, additional_types: "track,episode" }, max)).items;
		} catch (e) {
			if (!isGone(e)) throw e;
			rows = (await paginate<Row>(`/playlists/${id}/tracks`, { limit: 50, additional_types: "track,episode" }, max)).items;
		}
		return rows.map((r, i) => {
			const t = r.item ?? r.track;
			return t
				? { uri: t.uri, title: t.name, subtitle: artistLine(t), position: i, playable: !t.is_local }
				: { uri: "", title: tr("unavailableTrack"), subtitle: "", position: i, playable: false };
		});
	},
	async add(id: string, uri: string): Promise<void> {
		try {
			await request(`/playlists/${id}/items`, { method: "POST", body: { uris: [uri] } });
		} catch (e) {
			if (!isGone(e)) throw e;
			await request(`/playlists/${id}/tracks`, { method: "POST", body: { uris: [uri] } });
		}
	},
};

// ---------- Albums ----------

export const albums = {
	async info(id: string): Promise<{ name: string; artist: string }> {
		const a = await request<{ name: string; artists: Artist[] }>(`/albums/${id}`);
		return { name: a.name, artist: a.artists.map((x) => x.name).join(", ") };
	},
	async entries(id: string, max = 500): Promise<ListEntry[]> {
		const { items } = await paginate<Track>(`/albums/${id}/tracks`, { limit: 50 }, max);
		return items.map((t, i) => ({ uri: t.uri, title: t.name, subtitle: artistLine(t), position: i, playable: true }));
	},
};

// ---------- Artists / queue / history ----------

export type ArtistFull = Artist & { uri: string; genres?: string[] };
export type AlbumSimple = { id: string; uri: string; name: string; album_type: string; release_date?: string; artists: Artist[] };

/** True when a 403 is caused by the login missing a scope (needs re-login). */
export const isScopeError = (e: unknown) => e instanceof SpotifyError && e.status === 403 && /scope/i.test(e.message);

export const artists = {
	async followed(max = 200): Promise<ArtistFull[]> {
		const out: ArtistFull[] = [];
		let url: string | null = "/me/following";
		let query: Record<string, string | number> | undefined = { type: "artist", limit: 50 };
		while (url && out.length < max) {
			const page: { artists: { items: ArtistFull[]; next: string | null } } = await request(url, { query });
			out.push(...page.artists.items);
			url = page.artists.next;
			query = undefined;
		}
		return out;
	},
	async top(max = 20): Promise<ArtistFull[]> {
		return (await request<{ items: ArtistFull[] }>("/me/top/artists", { query: { limit: Math.min(max, 50), time_range: "medium_term" } })).items;
	},
	async topTracks(id: string): Promise<Track[]> {
		return (await request<{ tracks: Track[] }>(`/artists/${id}/top-tracks`, { query: { market: "from_token" } })).tracks;
	},
	async albums(id: string, max = 100): Promise<AlbumSimple[]> {
		return (await paginate<AlbumSimple>(`/artists/${id}/albums`, { limit: 50, include_groups: "album,single" }, max)).items;
	},
};

export const queue = async (): Promise<{ current: Track | null; queue: Track[] }> => {
	const q = await request<{ currently_playing: Track | null; queue: Track[] }>("/me/player/queue");
	return { current: q.currently_playing, queue: q.queue ?? [] };
};

export const recentlyPlayed = async (limit = 50): Promise<Track[]> => {
	const r = await request<{ items: { track: Track }[] }>("/me/player/recently-played", { query: { limit } });
	// Collapse consecutive repeats of the same track.
	return r.items.map((i) => i.track).filter((t, i, arr) => i === 0 || arr[i - 1].uri !== t.uri);
};

export const savedAlbums = async (max = 200): Promise<AlbumSimple[]> =>
	(await paginate<{ album: AlbumSimple }>("/me/albums", { limit: 50 }, max)).items.map((i) => i.album);
