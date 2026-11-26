import streamDeck from "@elgato/streamdeck";
import http from "node:http";

import { artistLine, describeError, me } from "./spotify/api";
import { beginLogin, completeLogin, getClientId, isLoggedIn, logout, missingScopes, REDIRECT_PORT, REDIRECT_URI } from "./spotify/auth";
import { lang, pickLang, t, type Lang } from "./i18n";
import { store } from "./spotify/store";

export const SETTINGS_URL = `http://127.0.0.1:${REDIRECT_PORT}/`;
const ORIGIN = `http://127.0.0.1:${REDIRECT_PORT}`;

let serverError: string | undefined;
export const getServerError = () => serverError;

async function status() {
	const loggedIn = await isLoggedIn();
	let user: string | null = null;
	let product: string | null = null;
	let error: string | null = null;
	if (loggedIn) {
		try {
			const p = await me.profile();
			user = p.display_name ?? p.id;
			product = p.product ?? null;
		} catch (e) {
			error = describeError(e);
		}
	}
	const pb = store.state.playback;
	return {
		loggedIn,
		missingScopes: await missingScopes(),
		user,
		product,
		error,
		clientId: (await getClientId()) ?? "",
		redirectUri: REDIRECT_URI,
		nowPlaying: pb?.item ? { title: pb.item.name, artist: artistLine(pb.item), device: pb.device?.name ?? null, playing: pb.is_playing } : null,
	};
}

const json = (res: http.ServerResponse, code: number, body: unknown) => {
	res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
	res.end(JSON.stringify(body));
};

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
	let raw = "";
	for await (const chunk of req) {
		raw += chunk;
		if (raw.length > 10_000) throw new Error("too large");
	}
	return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
	// Reject requests not addressed to the loopback host (DNS rebinding) and cross-site writes.
	if (req.headers.host !== `127.0.0.1:${REDIRECT_PORT}`) return void res.writeHead(421).end();
	const url = new URL(req.url ?? "/", ORIGIN);

	if (req.method === "POST") {
		if (req.headers.origin !== ORIGIN || !req.headers["content-type"]?.startsWith("application/json")) {
			return json(res, 403, { error: "forbidden" });
		}
		try {
			if (url.pathname === "/api/login") {
				const body = await readJson(req);
				return json(res, 200, { url: await beginLogin(String(body.clientId ?? "")) });
			}
			if (url.pathname === "/api/logout") {
				await logout();
				return json(res, 200, { ok: true });
			}
		} catch (e) {
			return json(res, 400, { error: (e as Error).message });
		}
		return json(res, 404, { error: "not found" });
	}

	if (url.pathname === "/api/status") return json(res, 200, await status());

	if (url.pathname === "/callback") {
		let target = "/?login=ok";
		try {
			await completeLogin(url.searchParams);
		} catch (e) {
			target = `/?login=error&msg=${encodeURIComponent((e as Error).message)}`;
		}
		res.writeHead(302, { Location: target });
		return void res.end();
	}

	if (url.pathname === "/") {
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
		return void res.end(page(pageLang(req.headers["accept-language"])));
	}
	res.writeHead(404).end();
}

/** Starts the always-on loopback server hosting the settings page and the OAuth callback. */
export function startServer(): void {
	const server = http.createServer((req, res) => {
		handle(req, res).catch((e) => {
			streamDeck.logger.error("settings server error", e);
			if (!res.headersSent) json(res, 500, { error: "internal error" });
		});
	});
	server.on("error", (e: NodeJS.ErrnoException) => {
		serverError = e.code === "EADDRINUSE" ? t("portInUse", REDIRECT_PORT) : e.message;
		streamDeck.logger.error(`settings server failed: ${serverError}`);
	});
	server.listen(REDIRECT_PORT, "127.0.0.1", () => {
		serverError = undefined;
		streamDeck.logger.info(`settings page at ${SETTINGS_URL}`);
	});
}

/** Picks the page language from the browser's Accept-Language, falling back to Stream Deck's. */
function pageLang(header: string | undefined): Lang {
	for (const part of (header ?? "").split(",")) {
		const l = pickLang(part.split(";")[0].trim());
		if (l) return l;
	}
	return lang();
}

export const PAGE_TEXT = {
	en: {
		title: "Spotify Deck+ Settings",
		sub: "Spotify controls for Stream Deck +",
		statusTitle: "Connection",
		checking: "Checking…",
		logout: "Log out",
		loginTitle: "Log in to Spotify",
		relogin: "New features need extra permissions. Please <b>log in again</b> below.",
		step1:
			'Open the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify Developer Dashboard</a> and click <b>Create app</b>',
		step2: "Set the Redirect URI to exactly {redirect}",
		step3: "Tick <b>Web API</b> and save",
		step4: "Copy the <b>Client ID</b> from the app's Settings and paste it below",
		placeholder: "Client ID (32 characters)",
		login: "Log in",
		loginAgain: "Log in again",
		copy: "Copy",
		copied: "Copied",
		usageTitle: "How to use",
		usage1: "Playback dial: rotate to seek 5 s, press to play/pause, tap for next, long-touch for previous",
		usage2: "Library dial: rotate to browse, press to open or play (hold to add to queue), tap to go back, long-touch to jump to Now Playing",
		usage3: "Add to playlist key: select the key in the Stream Deck app to choose the target playlist",
		usage4: "With no active device, the plugin opens Spotify on this computer and plays there",
		connectedAs: "Connected as {0}",
		connected: "Connected",
		loggedOut: "Not logged in",
		apiError: "API error: ",
		notPremium: "Playback control requires Spotify Premium.",
		noPlayback: "Nothing playing",
		enterClientId: "Enter your Client ID",
		loginFailed: "Login failed: ",
	},
	ko: {
		title: "Spotify Deck+ 설정",
		sub: "Stream Deck + 전용 Spotify 플러그인",
		statusTitle: "연결 상태",
		checking: "확인 중…",
		logout: "로그아웃",
		loginTitle: "Spotify 로그인",
		relogin: "새 기능에 필요한 권한이 추가됐어요. 아래에서 <b>다시 로그인</b>해 주세요.",
		step1: '<a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify 개발자 대시보드</a>에서 <b>Create app</b>',
		step2: "Redirect URI 에 {redirect} 를 정확히 입력",
		step3: "API 는 <b>Web API</b> 체크 후 저장",
		step4: "앱의 <b>Settings</b> 에서 Client ID 를 복사해 아래에 붙여넣기",
		placeholder: "Client ID (32자리)",
		login: "로그인",
		loginAgain: "다시 로그인",
		copy: "복사",
		copied: "복사됨",
		usageTitle: "사용법",
		usage1: "재생 제어 다이얼: 돌리면 5초 탐색, 누르면 재생/일시정지, 탭하면 다음 곡, 길게 터치하면 이전 곡",
		usage2: "라이브러리 탐색 다이얼: 돌려서 고르기, 누르면 열기/재생(길게 누르면 대기열에 추가), 탭하면 뒤로, 길게 터치하면 지금 재생 중으로",
		usage3: "재생목록에 추가 키: Stream Deck 앱에서 키를 선택해 대상 재생목록 지정",
		usage4: "활성 기기가 없으면 이 컴퓨터의 Spotify 를 열어 거기서 재생합니다",
		connectedAs: "{0} 계정으로 연결됨",
		connected: "연결됨",
		loggedOut: "로그인되어 있지 않습니다",
		apiError: "API 오류: ",
		notPremium: "재생 제어는 Spotify Premium 계정에서만 동작합니다.",
		noPlayback: "재생 중인 기기 없음",
		enterClientId: "Client ID 를 입력하세요",
		loginFailed: "로그인 실패: ",
	},
	ja: {
		title: "Spotify Deck+ 設定",
		sub: "Stream Deck + 専用 Spotify プラグイン",
		statusTitle: "接続状態",
		checking: "確認中…",
		logout: "ログアウト",
		loginTitle: "Spotify にログイン",
		relogin: "新機能に必要な権限が追加されました。下の <b>再ログイン</b> を押してください。",
		step1: '<a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify Developer Dashboard</a> で <b>Create app</b>',
		step2: "Redirect URI に {redirect} を正確に入力",
		step3: "API は <b>Web API</b> にチェックして保存",
		step4: "アプリの <b>Settings</b> から Client ID をコピーして下に貼り付け",
		placeholder: "Client ID (32文字)",
		login: "ログイン",
		loginAgain: "再ログイン",
		copy: "コピー",
		copied: "コピー済み",
		usageTitle: "使い方",
		usage1: "再生ダイヤル: 回すと5秒シーク、押すと再生/一時停止、タップで次の曲、長押しタッチで前の曲",
		usage2: "ライブラリダイヤル: 回して選択、押すと開く/再生 (長押しでキューに追加)、タップで戻る、長押しタッチで再生中へ",
		usage3: "プレイリストに追加キー: Stream Deck アプリでキーを選び、追加先のプレイリストを指定",
		usage4: "アクティブなデバイスがない場合、このコンピューターの Spotify を起動して再生します",
		connectedAs: "{0} として接続中",
		connected: "接続済み",
		loggedOut: "ログインしていません",
		apiError: "API エラー: ",
		notPremium: "再生操作には Spotify Premium が必要です。",
		noPlayback: "再生中のデバイスなし",
		enterClientId: "Client ID を入力してください",
		loginFailed: "ログイン失敗: ",
	},
} satisfies Record<Lang, Record<string, string>>;

function page(l: Lang): string {
	const T = PAGE_TEXT[l];
	const copy = `<span class="copy"><code id="redirect"></code><button class="ghost" id="copy">${T.copy}</button></span>`;
	return /* html */ `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${T.title}</title>
<style>
	:root { color-scheme: dark; --g: #1ed760; --bg: #121212; --card: #1e1e1e; --line: #2e2e2e; --muted: #a7a7a7; --err: #f15e6c; }
	* { box-sizing: border-box; }
	body { margin: 0; background: var(--bg); color: #fff; font: 15px/1.6 -apple-system, "Apple SD Gothic Neo", "Hiragino Sans", sans-serif; }
	main { max-width: 640px; margin: 0 auto; padding: 40px 20px 60px; }
	h1 { font-size: 26px; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; }
	h1 .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--g); }
	.sub { color: var(--muted); margin: 0 0 28px; }
	.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
	h2 { font-size: 16px; margin: 0 0 12px; }
	.status { display: flex; align-items: center; gap: 10px; font-weight: 600; }
	.badge { width: 10px; height: 10px; border-radius: 50%; background: #555; flex: none; }
	.ok .badge { background: var(--g); }
	.bad .badge { background: var(--err); }
	.muted { color: var(--muted); font-size: 13px; }
	.err { color: var(--err); }
	.row { display: flex; gap: 8px; margin-top: 12px; }
	input { flex: 1; min-width: 0; background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; color: #fff; padding: 10px 12px; font: 14px ui-monospace, Menlo, monospace; }
	input:focus { outline: 2px solid var(--g); border-color: transparent; }
	button { background: var(--g); color: #000; border: 0; border-radius: 999px; padding: 10px 20px; font: inherit; font-weight: 700; cursor: pointer; }
	button.ghost { background: transparent; color: #fff; border: 1px solid #555; }
	button:disabled { opacity: .5; cursor: default; }
	ol { margin: 0; padding-left: 20px; }
	ol li { margin: 6px 0; }
	code { background: #2a2a2a; border-radius: 6px; padding: 2px 6px; font: 13px ui-monospace, Menlo, monospace; }
	.copy { display: inline-flex; align-items: center; gap: 6px; }
	.copy button { padding: 2px 10px; font-size: 12px; }
	a { color: var(--g); }
	.np { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
	[hidden] { display: none !important; }
</style>
</head>
<body>
<main>
	<h1><span class="dot"></span>Spotify Deck+</h1>
	<p class="sub">${T.sub}</p>

	<section class="card">
		<h2>${T.statusTitle}</h2>
		<div id="status" class="status"><span class="badge"></span><span id="status-text">${T.checking}</span></div>
		<p id="status-detail" class="muted" hidden></p>
		<div id="now" class="np muted" hidden></div>
		<div class="row" id="logout-row" hidden><button class="ghost" id="logout">${T.logout}</button></div>
	</section>

	<section class="card" id="login-card">
		<h2>${T.loginTitle}</h2>
		<p id="relogin" class="err" hidden>${T.relogin}</p>
		<ol>
			<li>${T.step1}</li>
			<li>${T.step2.replace("{redirect}", copy)}</li>
			<li>${T.step3}</li>
			<li>${T.step4}</li>
		</ol>
		<div class="row">
			<input id="client-id" placeholder="${T.placeholder}" spellcheck="false" autocomplete="off">
			<button id="login">${T.login}</button>
		</div>
		<p id="login-msg" class="muted" hidden></p>
	</section>

	<section class="card">
		<h2>${T.usageTitle}</h2>
		<ul class="muted" style="margin:0;padding-left:20px">
			<li>${T.usage1}</li>
			<li>${T.usage2}</li>
			<li>${T.usage3}</li>
			<li>${T.usage4}</li>
		</ul>
	</section>
</main>
<script>
const T = ${JSON.stringify(T)};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const post = (path, body) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) }).then(async (r) => ({ ok: r.ok, data: await r.json() }));

function msg(text, isErr) {
	const el = $("login-msg");
	el.hidden = !text;
	el.className = isErr ? "err" : "muted";
	el.textContent = text ?? "";
}

async function refresh() {
	let s;
	try {
		s = await fetch("/api/status").then((r) => r.json());
	} catch {
		return; // plugin restarting; next poll will catch up
	}
	$("redirect").textContent = s.redirectUri;
	if (s.clientId && !$("client-id").value) $("client-id").value = s.clientId;
	$("status").className = "status " + (s.loggedIn ? (s.error ? "bad" : "ok") : "");
	$("status-text").textContent = s.loggedIn ? (s.user ? T.connectedAs.replace("{0}", s.user) : T.connected) : T.loggedOut;
	const detail = s.error ? T.apiError + s.error : s.product && s.product !== "premium" ? T.notPremium : "";
	$("status-detail").hidden = !detail;
	$("status-detail").textContent = detail;
	$("logout-row").hidden = !s.loggedIn;
	const needRelogin = s.loggedIn && s.missingScopes?.length > 0;
	$("login-card").hidden = s.loggedIn && !needRelogin;
	$("relogin").hidden = !needRelogin;
	$("login").textContent = needRelogin ? T.loginAgain : T.login;
	const np = $("now");
	np.hidden = !s.loggedIn;
	np.innerHTML = s.nowPlaying
		? (s.nowPlaying.playing ? "▶ " : "⏸ ") + "<b style='color:#fff'>" + esc(s.nowPlaying.title) + "</b> " + esc(s.nowPlaying.artist) + (s.nowPlaying.device ? " · " + esc(s.nowPlaying.device) : "")
		: T.noPlayback;
}

$("login").onclick = async () => {
	const clientId = $("client-id").value.trim();
	if (!clientId) return msg(T.enterClientId, true);
	$("login").disabled = true;
	const { ok, data } = await post("/api/login", { clientId });
	$("login").disabled = false;
	if (!ok) return msg(data.error, true);
	location.href = data.url;
};
$("logout").onclick = async () => { await post("/api/logout"); refresh(); };
$("copy").onclick = () => navigator.clipboard.writeText($("redirect").textContent).then(() => ($("copy").textContent = T.copied));

const q = new URLSearchParams(location.search);
if (q.get("login") === "error") msg(T.loginFailed + q.get("msg"), true);
if (q.get("login")) history.replaceState(null, "", "/");
refresh();
setInterval(refresh, 5000);
</script>
</body>
</html>`;
}
