import streamDeck from "@elgato/streamdeck";

import { adoptLocalDevice, describeError, library, onDeviceStatus, player, type Playback } from "./api";
import { isLoggedIn, NotLoggedInError, onAuthChanged } from "./auth";
import { t } from "../i18n";

export type PlayerState = {
	loggedIn: boolean;
	playback?: Playback;
	/** Whether the current track is in Liked Songs (undefined = unknown). */
	liked?: boolean;
	error?: string;
	/** Epoch ms when playback was fetched (used to interpolate progress). */
	fetchedAt: number;
};

type Listener = (s: PlayerState) => void;

/** Poll intervals (ms). Faster right after the user touches something, slower when idle. */
export const POLL = {
	active: 1000,
	playing: 3000,
	paused: 6000,
	idle: 15000,
	/** How long "active" lasts after the last interaction. */
	activeWindow: 15000,
};

/** Picks the next poll delay for the given state. Exported for tests. */
export function pollDelay(s: PlayerState, now: number, lastActivity: number, progress: number): number {
	if (now - lastActivity < POLL.activeWindow) return POLL.active;
	const p = s.playback;
	if (!s.loggedIn || !p) return POLL.idle;
	if (!p.is_playing) return POLL.paused;
	// Refresh right after the current track ends so the next one shows up promptly.
	const remaining = (p.item?.duration_ms ?? Infinity) - progress;
	return Math.max(500, Math.min(POLL.playing, remaining + 300));
}

/**
 * Single shared poller for `/me/player`, so a deck full of actions costs one request per tick.
 * Polling only runs while at least one action is visible, and adapts its interval to the state
 * (see {@link pollDelay}).
 */
class PlayerStore {
	state: PlayerState = { loggedIn: false, fetchedAt: 0 };
	private listeners = new Set<Listener>();
	private timer?: NodeJS.Timeout;
	private nextAt = 0;
	private lastActivity = 0;
	private inFlight = false;
	private likedFor?: string;
	/** Shown instead of "no device" while the local app is being started. */
	private deviceStatus?: string;

	constructor() {
		onAuthChanged(() => void this.refresh());
		onDeviceStatus((msg) => {
			this.deviceStatus = msg;
			if (msg) this.patch((s) => (s.error = msg));
			else this.refreshSoon(0);
		});
	}

	subscribe(fn: Listener): () => void {
		this.listeners.add(fn);
		fn(this.state);
		if (this.listeners.size === 1) void this.refresh();
		return () => {
			this.listeners.delete(fn);
			if (this.listeners.size === 0) {
				clearTimeout(this.timer);
				this.timer = undefined;
			}
		};
	}

	/** Current playback position, interpolated since the last fetch. */
	progress(): number {
		const p = this.state.playback;
		if (!p?.progress_ms) return 0;
		const elapsed = p.is_playing ? Date.now() - this.state.fetchedAt : 0;
		return Math.min(p.progress_ms + elapsed, p.item?.duration_ms ?? Infinity);
	}

	/** Apply an optimistic local change and notify immediately. */
	patch(fn: (s: PlayerState) => void): void {
		fn(this.state);
		this.emit();
	}

	/** Re-fetch shortly (after a command, Spotify needs a moment to reflect it). */
	refreshSoon(delay = 500): void {
		this.schedule(delay, true);
	}

	/** Marks user interaction: polls quickly for a while so the deck feels live. */
	activity(): void {
		this.lastActivity = Date.now();
		this.schedule(POLL.active);
	}

	/** Schedules the next poll in `delay` ms, unless one is already due sooner (or `force`). */
	private schedule(delay: number, force = false): void {
		if (!this.listeners.size && !force) return;
		const at = Date.now() + delay;
		if (this.timer && !force && this.nextAt <= at) return;
		clearTimeout(this.timer);
		this.nextAt = at;
		this.timer = setTimeout(() => {
			this.timer = undefined;
			void this.refresh();
		}, delay);
	}

	async refresh(): Promise<void> {
		if (this.inFlight) return;
		this.inFlight = true;
		try {
			if (!(await isLoggedIn())) {
				this.state = { loggedIn: false, fetchedAt: Date.now(), error: t("notLoggedIn") };
				return;
			}
			const playback = (await player.get()) ?? undefined;
			if (!playback) {
				adoptLocalDevice()
					.then((adopted) => adopted && this.refreshSoon(800))
					.catch((e) => streamDeck.logger.warn("adopt local device failed", e));
			}
			const trackId = playback?.item?.id ?? undefined;
			let liked = this.state.liked;
			if (trackId !== this.likedFor) {
				this.likedFor = trackId;
				liked = undefined;
				if (playback?.item && playback.currently_playing_type === "track") {
					liked = await library.isSaved(playback.item).catch(() => undefined);
				}
			}
			this.state = { loggedIn: true, playback, liked, fetchedAt: Date.now(), error: playback ? undefined : (this.deviceStatus ?? t("noPlayback")) };
		} catch (e) {
			if (e instanceof NotLoggedInError) {
				this.state = { loggedIn: false, fetchedAt: Date.now(), error: t("notLoggedIn") };
			} else {
				streamDeck.logger.warn("player refresh failed", e);
				this.state = { ...this.state, error: describeError(e) };
			}
		} finally {
			this.inFlight = false;
			this.emit();
			if (this.listeners.size && !this.timer) this.schedule(pollDelay(this.state, Date.now(), this.lastActivity, this.progress()));
		}
	}

	private emit(): void {
		for (const fn of this.listeners) {
			try {
				fn(this.state);
			} catch (e) {
				streamDeck.logger.error("listener failed", e);
			}
		}
	}
}

export const store = new PlayerStore();

/**
 * Runs a player command, surfacing errors as a short alert and refreshing state afterwards.
 * Returns false when the command failed.
 */
export async function command(fn: () => Promise<unknown>, onError?: (msg: string) => void): Promise<boolean> {
	store.activity();
	try {
		await fn();
		store.refreshSoon();
		return true;
	} catch (e) {
		const msg = describeError(e);
		streamDeck.logger.warn("command failed", msg);
		onError?.(msg);
		store.refreshSoon(0);
		return false;
	}
}
