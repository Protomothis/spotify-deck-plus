/**
 * Platform-specific control of the Spotify desktop app on this computer (macOS and Windows):
 * the name it uses on Spotify Connect, whether it is running, starting it, and waking it up.
 */
import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const isMac = () => process.platform === "darwin";
const isWindows = () => process.platform === "win32";

/** True when `tasklist /FO CSV` output lists a Spotify process. */
export const tasklistHasSpotify = (out: string) => /^"spotify\.exe"/im.test(out);

let name: Promise<string> | undefined;

/** The device name Spotify Connect shows for this computer (the OS computer name). */
export function computerName(): Promise<string> {
	return (name ??= (async () => {
		if (isMac()) {
			try {
				return (await run("/usr/sbin/scutil", ["--get", "ComputerName"])).stdout.trim();
			} catch {
				/* fall through */
			}
		}
		if (isWindows() && process.env.COMPUTERNAME) return process.env.COMPUTERNAME;
		return os.hostname().replace(/\.local$/, "");
	})());
}

/** Whether the Spotify desktop app is running. */
export async function isSpotifyRunning(): Promise<boolean> {
	try {
		if (isWindows()) {
			const { stdout } = await run("tasklist", ["/FI", "IMAGENAME eq Spotify.exe", "/FO", "CSV", "/NH"], { windowsHide: true });
			return tasklistHasSpotify(stdout);
		}
		await run("/usr/bin/pgrep", ["-x", "Spotify"]);
		return true;
	} catch {
		return false;
	}
}

/**
 * Starts Spotify without stealing focus where possible: hidden on macOS, minimized for the classic
 * Windows installer. The Microsoft Store version is started through its `spotify:` URI.
 */
export async function launchSpotify(): Promise<void> {
	if (isMac()) {
		await run("/usr/bin/open", ["-g", "-a", "Spotify"]);
		return;
	}
	if (isWindows()) {
		const exe = path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "Spotify", "Spotify.exe");
		if (fs.existsSync(exe)) {
			spawn(exe, ["--minimized"], { detached: true, stdio: "ignore", windowsHide: true }).unref();
		} else {
			await run("cmd.exe", ["/c", "start", "", "spotify:"], { windowsHide: true });
		}
		return;
	}
	throw new Error(`Starting Spotify is not supported on ${process.platform}`);
}

/**
 * Pokes a running app that has dropped off Spotify Connect so it registers again. macOS uses
 * AppleScript; Windows has no equivalent, so this is a no-op there. Returns whether it tried.
 */
export async function nudgeSpotify(): Promise<boolean> {
	if (!isMac()) return false;
	await run("/usr/bin/osascript", ["-e", 'tell application "Spotify" to play']);
	return true;
}
