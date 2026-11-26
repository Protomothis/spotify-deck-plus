import type { JsonObject } from "@elgato/utils";
import { SingletonAction, type Action, type WillAppearEvent, type WillDisappearEvent } from "@elgato/streamdeck";

import { marquee, spinnerImage } from "../render";
import { command, store, type PlayerState } from "../spotify/store";

/**
 * Base for actions that mirror the shared player state. Subscribes to the store while at least one
 * instance is visible and de-duplicates images/feedback so unchanged state costs nothing.
 */
export abstract class PlayerAction<T extends JsonObject = JsonObject> extends SingletonAction<T> {
	private unsub?: () => void;
	private last = new Map<string, string>();
	/** Last feedback sent per action, per layout key (JSON), so only changed keys are sent. */
	private lastFeedback = new Map<string, Map<string, string>>();
	/** Set by subclasses that render scrolling text; drives a slow re-render ticker. */
	protected marqueeMs = 0;
	private marqueeTimer?: NodeJS.Timeout;
	private tick = 0;
	/** Per action+slot: the text being scrolled and the tick it started at. */
	private scrolls = new Map<string, { text: string; start: number }>();

	override onWillAppear(ev: WillAppearEvent<T>): void {
		this.last.delete(ev.action.id);
		this.lastFeedback.delete(ev.action.id);
		this.layouts.delete(ev.action.id);
		if (!this.unsub) {
			this.unsub = store.subscribe((s) => this.renderAll(s));
			if (this.marqueeMs) {
				this.marqueeTimer = setInterval(() => {
					this.tick++;
					this.renderAll();
				}, this.marqueeMs);
			}
		} else {
			void this.render(ev.action, store.state);
		}
	}

	override onWillDisappear(ev: WillDisappearEvent<T>): void {
		this.last.delete(ev.action.id);
		this.lastFeedback.delete(ev.action.id);
		this.layouts.delete(ev.action.id);
		// The disappearing action may still be enumerated during this event.
		setTimeout(() => {
			if (![...this.actions].length) {
				this.unsub?.();
				this.unsub = undefined;
				clearInterval(this.marqueeTimer);
				this.marqueeTimer = undefined;
			}
		}, 0);
	}

	protected renderAll(s: PlayerState = store.state): void {
		for (const a of this.actions) void this.render(a, s);
	}

	protected abstract render(action: Action<T>, s: PlayerState): void | Promise<void>;

	/**
	 * Scrolling text for a touch-strip text item of `width` px at font `size`. Restarts from the
	 * beginning whenever the text in that slot changes.
	 */
	protected scroll(action: Action<T>, slot: string, text: string, width: number, size: number): string {
		const key = `${action.id}:${slot}`;
		let s = this.scrolls.get(key);
		if (!s || s.text !== text) this.scrolls.set(key, (s = { text, start: this.tick }));
		return marquee(text, width, size, this.tick - s.start);
	}

	/** Actions currently showing the loading spinner (normal renders are held back). */
	private busy = new Set<string>();

	/**
	 * Runs a player command for a key press. A spinner replaces the key image while it takes longer
	 * than a moment; the alert triangle only appears on a real failure.
	 */
	protected async run(action: Action<T>, fn: () => Promise<unknown>): Promise<boolean> {
		let frame = 0;
		let timer: NodeJS.Timeout | undefined;
		const delay = setTimeout(() => {
			if (!action.isKey()) return;
			this.busy.add(action.id);
			const draw = () => void action.setImage(spinnerImage(frame++));
			draw();
			timer = setInterval(draw, 90);
		}, 250);
		const ok = await command(fn);
		clearTimeout(delay);
		clearInterval(timer);
		if (this.busy.delete(action.id)) {
			this.last.delete(action.id);
			await this.render(action, store.state);
		}
		if (!ok && (action.isKey() || action.isDial())) await action.showAlert();
		return ok;
	}

	/** setImage, skipped when unchanged. */
	protected async image(action: Action<T>, img: string): Promise<void> {
		if (!action.isKey() || this.busy.has(action.id) || this.last.get(action.id) === img) return;
		this.last.set(action.id, img);
		await action.setImage(img);
	}

	/** Current touch-strip layout per action (when switched at runtime). */
	private layouts = new Map<string, string>();

	/** Switches the dial's layout when it differs; everything is re-sent after a switch. */
	protected async layout(action: Action<T>, path: string): Promise<void> {
		if (!action.isDial() || this.layouts.get(action.id) === path) return;
		this.layouts.set(action.id, path);
		this.lastFeedback.delete(action.id);
		await action.setFeedbackLayout(path);
	}

	/**
	 * setFeedback with only the layout keys that changed since the last call. Large values such as
	 * album art are sent once instead of on every marquee tick.
	 */
	protected async feedback(action: Action<T>, payload: Record<string, unknown>): Promise<void> {
		if (!action.isDial()) return;
		let sent = this.lastFeedback.get(action.id);
		if (!sent) this.lastFeedback.set(action.id, (sent = new Map()));
		const changed: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(payload)) {
			const json = JSON.stringify(v);
			if (sent.get(k) === json) continue;
			sent.set(k, json);
			changed[k] = v;
		}
		if (!Object.keys(changed).length) return;
		await action.setFeedback(changed as Parameters<typeof action.setFeedback>[0]);
	}
}
