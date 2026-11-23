import streamDeck from "@elgato/streamdeck";

import { LikedSongsDial, PlaybackDial, PlaylistsDial, VolumeDial } from "./actions/dials";
import { ExplorerDial } from "./actions/explorer";
import { AddToPlaylistKey, DeviceKey, LikeKey, NextKey, PlayPauseKey, PreviousKey, RepeatKey, SetupKey, ShuffleKey } from "./actions/keys";
import { registerPropertyInspectorHandlers } from "./pi";
import { startServer } from "./server";

// "info" keeps tokens out of the log (trace would record every message, including API payloads).
streamDeck.logger.setLevel("info");

for (const a of [
	new PlayPauseKey(),
	new PreviousKey(),
	new NextKey(),
	new LikeKey(),
	new ShuffleKey(),
	new RepeatKey(),
	new AddToPlaylistKey(),
	new DeviceKey(),
	new SetupKey(),
	new PlaybackDial(),
	new VolumeDial(),
	new ExplorerDial(),
	new PlaylistsDial(),
	new LikedSongsDial(),
]) {
	streamDeck.actions.registerAction(a);
}

registerPropertyInspectorHandlers();
startServer();

streamDeck.connect().then(() => streamDeck.logger.info("Spotify Deck connected"));
