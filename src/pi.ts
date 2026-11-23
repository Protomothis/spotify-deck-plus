import streamDeck from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";

import { describeError, me, playlists } from "./spotify/api";
import { isLoggedIn, onAuthChanged } from "./spotify/auth";
import { SETTINGS_URL } from "./server";

type Msg = { event: "status" } | { event: "openSettings" } | { event: "playlists" };

const send = (payload: JsonValue) => streamDeck.ui.sendToPropertyInspector(payload).catch(() => undefined);

async function status(): Promise<void> {
	const loggedIn = await isLoggedIn();
	let user: string | null = null;
	if (loggedIn) {
		try {
			const p = await me.profile();
			user = p.display_name ?? p.id;
		} catch (e) {
			user = `(${describeError(e)})`;
		}
	}
	await send({ event: "status", loggedIn, user });
}

/** Handles messages from the property inspector (ui/settings.html). */
export function registerPropertyInspectorHandlers(): void {
	onAuthChanged(() => void status());
	streamDeck.ui.onSendToPlugin<Msg>(async (ev) => {
		const msg = ev.payload;
		streamDeck.logger.info(`PI -> plugin: ${msg?.event} (action ${ev.action.manifestId})`);
		try {
			switch (msg.event) {
				case "status":
					return await status();
				case "openSettings":
					return await streamDeck.system.openUrl(SETTINGS_URL);
				case "playlists": {
					const [mine, profile] = await Promise.all([playlists.mine(), me.profile()]);
					// Only playlists the user can add to.
					const items = mine.filter((p) => p.owner.id === profile.id || p.collaborative).map((p) => ({ id: p.id, name: p.name }));
					return await send({ event: "playlists", items });
				}
			}
		} catch (e) {
			streamDeck.logger.error("PI message failed", e);
			await send({ event: "error", message: describeError(e) });
		}
	});
}
