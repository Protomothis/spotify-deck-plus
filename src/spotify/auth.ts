import streamDeck from "@elgato/streamdeck";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { t as tr } from "../i18n";

/** Loopback redirect URI — must be registered verbatim in the Spotify developer dashboard. */
export const REDIRECT_PORT = 8888;
export const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;

const REQUIRED_SCOPES = [
	"user-read-playback-state",
	"user-modify-playback-state",
	"user-read-currently-playing",
	"playlist-read-private",
	"playlist-read-collaborative",
	"playlist-modify-private",
	"playlist-modify-public",
	"user-library-read",
	"user-library-modify",
	"user-follow-read",
	"user-read-recently-played",
	"user-top-read",
];
const SCOPES = REQUIRED_SCOPES.join(" ");

const TOKEN_DIR = path.join(os.homedir(), ".config", "spotify-deck-plus");
const TOKEN_FILE = path.join(TOKEN_DIR, "tokens.json");

type StoredAuth = {
	clientId: string;
	accessToken?: string;
	refreshToken?: string;
	/** Epoch ms at which the access token expires. */
	expiresAt?: number;
	/** Space separated scopes granted with the current token. */
	scope?: string;
};

export class NotLoggedInError extends Error {
	constructor() {
		super(tr("loginRequired"));
	}
}

let cache: StoredAuth | undefined;
let refreshing: Promise<string> | undefined;
const listeners = new Set<() => void>();

/** Subscribe to login/logout changes. */
export function onAuthChanged(fn: () => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

async function load(): Promise<StoredAuth | undefined> {
	if (cache) return cache;
	try {
		cache = JSON.parse(await readFile(TOKEN_FILE, "utf8")) as StoredAuth;
	} catch {
		cache = undefined;
	}
	return cache;
}

async function save(auth: StoredAuth): Promise<void> {
	cache = auth;
	await mkdir(TOKEN_DIR, { recursive: true, mode: 0o700 });
	await writeFile(TOKEN_FILE, JSON.stringify(auth, null, 2), { mode: 0o600 });
}

export async function getClientId(): Promise<string | undefined> {
	return (await load())?.clientId;
}

/** Scopes this plugin needs but the stored login did not grant (empty when up to date). */
export async function missingScopes(): Promise<string[]> {
	const auth = await load();
	if (!auth?.refreshToken) return [];
	const granted = new Set((auth.scope ?? "").split(" ").filter(Boolean));
	// Logins made before scopes were recorded: assume the original set.
	if (!auth.scope) return ["user-follow-read", "user-read-recently-played", "user-top-read"];
	return REQUIRED_SCOPES.filter((sc) => !granted.has(sc));
}

export async function isLoggedIn(): Promise<boolean> {
	return !!(await load())?.refreshToken;
}

export async function logout(): Promise<void> {
	const auth = await load();
	if (auth) await save({ clientId: auth.clientId });
	listeners.forEach((fn) => fn());
}

async function tokenRequest(params: Record<string, string>): Promise<{
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	scope?: string;
}> {
	const res = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams(params),
	});
	if (!res.ok) {
		throw new Error(tr("tokenFailed", res.status, await res.text()));
	}
	return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
}

/** Returns a valid access token, refreshing it when it is about to expire. */
export async function getAccessToken(forceRefresh = false): Promise<string> {
	const auth = await load();
	if (!auth?.refreshToken) throw new NotLoggedInError();
	if (!forceRefresh && auth.accessToken && auth.expiresAt && auth.expiresAt - 60_000 > Date.now()) {
		return auth.accessToken;
	}
	refreshing ??= (async () => {
		try {
			const t = await tokenRequest({
				grant_type: "refresh_token",
				refresh_token: auth.refreshToken!,
				client_id: auth.clientId,
			});
			await save({
				clientId: auth.clientId,
				accessToken: t.access_token,
				scope: t.scope ?? auth.scope,
				refreshToken: t.refresh_token ?? auth.refreshToken,
				expiresAt: Date.now() + t.expires_in * 1000,
			});
			return t.access_token;
		} catch (e) {
			streamDeck.logger.error("Token refresh failed", e);
			// A rejected refresh token means the user must log in again.
			if (String(e).includes("invalid_grant")) await logout();
			throw e;
		} finally {
			refreshing = undefined;
		}
	})();
	return refreshing;
}

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

type Pending = { clientId: string; verifier: string; state: string; createdAt: number };
let pending: Pending | undefined;

/**
 * First half of the Authorization Code + PKCE flow: remembers the verifier/state and returns the
 * Spotify consent URL. The redirect lands on the local settings server, which calls completeLogin.
 */
export async function beginLogin(clientId: string): Promise<string> {
	clientId = clientId.trim();
	if (!/^[0-9a-f]{32}$/i.test(clientId)) throw new Error(tr("badClientId"));

	const verifier = b64url(randomBytes(64));
	const challenge = b64url(createHash("sha256").update(verifier).digest());
	const state = b64url(randomBytes(16));
	pending = { clientId, verifier, state, createdAt: Date.now() };

	// Remember the client id right away so the settings page can show it.
	const prev = await load();
	if (!prev || prev.clientId !== clientId) await save({ clientId });

	const authorize = new URL("https://accounts.spotify.com/authorize");
	authorize.search = new URLSearchParams({
		response_type: "code",
		client_id: clientId,
		scope: SCOPES,
		redirect_uri: REDIRECT_URI,
		code_challenge_method: "S256",
		code_challenge: challenge,
		state,
	}).toString();
	streamDeck.logger.info("Login started");
	return authorize.toString();
}

/** Second half: exchanges the code from the redirect for tokens. */
export async function completeLogin(params: URLSearchParams): Promise<void> {
	const p = pending;
	try {
		const err = params.get("error");
		if (err) throw new Error(err === "access_denied" ? tr("accessDenied") : err);
		if (!p || params.get("state") !== p.state) throw new Error(tr("loginExpired"));
		if (Date.now() - p.createdAt > 10 * 60_000) throw new Error(tr("loginTimeout"));
		const code = params.get("code");
		if (!code) throw new Error(tr("noCode"));
		const t = await tokenRequest({
			grant_type: "authorization_code",
			code,
			redirect_uri: REDIRECT_URI,
			client_id: p.clientId,
			code_verifier: p.verifier,
		});
		await save({
			clientId: p.clientId,
			accessToken: t.access_token,
			scope: t.scope,
			refreshToken: t.refresh_token,
			expiresAt: Date.now() + t.expires_in * 1000,
		});
		pending = undefined;
		streamDeck.logger.info("Login succeeded");
		listeners.forEach((fn) => fn());
	} catch (e) {
		streamDeck.logger.warn(`Login failed: ${(e as Error).message}`);
		throw e;
	}
}
