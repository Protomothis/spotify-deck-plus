import { describe, expect, it } from "vitest";

import type { Playback } from "../src/spotify/api";
import { POLL, pollDelay, type PlayerState } from "../src/spotify/store";

const playback = (is_playing: boolean, duration_ms = 200_000) => ({ is_playing, item: { duration_ms } }) as unknown as Playback;
const state = (p?: Playback, loggedIn = true): PlayerState => ({ loggedIn, playback: p, fetchedAt: 0 });

describe("pollDelay", () => {
	const now = 1_000_000;
	const idleSince = now - POLL.activeWindow - 1;

	it("polls fast right after an interaction", () => {
		expect(pollDelay(state(), now, now - 1000, 0)).toBe(POLL.active);
	});

	it("backs off when logged out or nothing is playing", () => {
		expect(pollDelay(state(undefined, false), now, idleSince, 0)).toBe(POLL.idle);
		expect(pollDelay(state(), now, idleSince, 0)).toBe(POLL.idle);
	});

	it("polls slower while paused", () => {
		expect(pollDelay(state(playback(false)), now, idleSince, 0)).toBe(POLL.paused);
	});

	it("wakes up right after the track ends", () => {
		expect(pollDelay(state(playback(true)), now, idleSince, 0)).toBe(POLL.playing);
		expect(pollDelay(state(playback(true, 200_000)), now, idleSince, 199_000)).toBe(1300);
		expect(pollDelay(state(playback(true, 200_000)), now, idleSince, 200_000)).toBe(500);
	});
});
