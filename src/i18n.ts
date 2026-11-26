import streamDeck from "@elgato/streamdeck";

/** Languages with full translations; anything else falls back to English. */
export const LANGS = ["en", "ko", "ja"] as const;
export type Lang = (typeof LANGS)[number];

const en = {
	// Errors / status
	notLoggedIn: "Not logged in",
	loginRequired: "Spotify login required",
	loginHint: "Log in on the settings page",
	noActiveDevice: "No active device",
	premiumRequired: "Premium required",
	volumeDisallowed: "Volume locked on this device",
	forbidden: "Not permitted",
	rateLimited: "Too many requests, wait",
	error: "Error {0}",
	openingSpotify: "Opening Spotify…",
	connectingSpotify: "Connecting to Spotify…",
	noPlayback: "Nothing playing",
	notPlaying: "Not playing",
	unavailableTrack: "(Unavailable track)",
	scopeMissing: "Permission needed · log in again on the settings page",
	loading: "Loading…",
	loadFailed: "Failed to load",
	empty: "Empty",
	tapBack: "‹ Tap to go back",
	addedToQueue: "✓ Added to queue",

	// Auth
	tokenFailed: "Token request failed ({0}): {1}",
	badClientId: "Invalid Client ID (32 hex characters)",
	accessDenied: "Access was denied",
	loginExpired: "Login request expired. Please try again",
	loginTimeout: "Login timed out",
	noCode: "Missing authorization code",

	// Library explorer
	library: "Library",
	nowPlaying: "Now Playing",
	upNext: "Up Next",
	queue: "Queue",
	queueEmpty: "Queue is empty",
	myPlaylists: "My Playlists",
	likedSongs: "Liked Songs",
	artists: "Artists",
	savedAlbums: "Saved Albums",
	recent: "Recently Played",
	playAll: "Play all",
	playAlbum: "Play album",
	playArtist: "Play artist",
	topTracks: "Top tracks",
	artistTopTracks: "{0} · Top tracks",
	single: "Single",
	album: "Album",
	listeningNow: "Listening now",
	following: "Following",
	frequent: "Frequently played",
	artist: "Artist",
	noContext: "Playing without a playlist",
	unsupportedContext: "Unsupported context ({0})",
	noPlaylists: "No playlists",
	noLiked: "No liked songs",

	// Keys / dials
	volume: "Volume",
	shuffleOn: "Shuffle on",
	shuffleOff: "Shuffle off",
	repeatOff: "Repeat off",
	repeatAll: "Repeat all",
	repeatOne: "Repeat one",
	needsSetup: "Set up",
	noDevice: "No device",
	connected: "Connected",
	settings: "Settings",
	portInUse: "Port {0} in use",
};

export type Key = keyof typeof en;

const ko: Record<Key, string> = {
	notLoggedIn: "로그인 필요",
	loginRequired: "Spotify 로그인이 필요합니다",
	loginHint: "설정 페이지에서 로그인",
	noActiveDevice: "활성 기기 없음",
	premiumRequired: "Premium 필요",
	volumeDisallowed: "볼륨 제어 불가 기기",
	forbidden: "권한 없음",
	rateLimited: "요청 과다, 잠시 후",
	error: "오류 {0}",
	openingSpotify: "Spotify 여는 중…",
	connectingSpotify: "Spotify 연결 중…",
	noPlayback: "재생 중인 기기 없음",
	notPlaying: "재생 중 아님",
	unavailableTrack: "(사용할 수 없는 곡)",
	scopeMissing: "권한 필요 · 설정 페이지에서 다시 로그인",
	loading: "불러오는 중…",
	loadFailed: "불러오기 실패",
	empty: "비어 있음",
	tapBack: "‹ 탭하면 뒤로",
	addedToQueue: "✓ 대기열에 추가함",

	tokenFailed: "토큰 요청 실패 ({0}): {1}",
	badClientId: "Client ID 형식이 올바르지 않습니다 (32자리 16진수)",
	accessDenied: "권한 허용이 취소되었습니다",
	loginExpired: "로그인 요청이 만료되었습니다. 다시 시도하세요",
	loginTimeout: "로그인 시간이 초과되었습니다",
	noCode: "인증 코드가 없습니다",

	library: "라이브러리",
	nowPlaying: "지금 재생 중",
	upNext: "다음 재생 대기열",
	queue: "대기열",
	queueEmpty: "대기열이 비어 있음",
	myPlaylists: "내 재생목록",
	likedSongs: "좋아요 표시한 곡",
	artists: "아티스트",
	savedAlbums: "저장한 앨범",
	recent: "최근 재생",
	playAll: "전체 재생",
	playAlbum: "앨범 전체 재생",
	playArtist: "아티스트 재생",
	topTracks: "인기곡",
	artistTopTracks: "{0} 인기곡",
	single: "싱글",
	album: "앨범",
	listeningNow: "지금 듣는 중",
	following: "팔로우",
	frequent: "자주 듣는",
	artist: "아티스트",
	noContext: "재생목록 없이 재생 중",
	unsupportedContext: "지원하지 않는 재생 방식 ({0})",
	noPlaylists: "재생목록 없음",
	noLiked: "좋아요 표시한 곡 없음",

	volume: "볼륨",
	shuffleOn: "셔플 켬",
	shuffleOff: "셔플 끔",
	repeatOff: "반복 끔",
	repeatAll: "전체 반복",
	repeatOne: "한 곡 반복",
	needsSetup: "설정 필요",
	noDevice: "기기 없음",
	connected: "연결됨",
	settings: "설정",
	portInUse: "포트 {0} 사용 중",
};

const ja: Record<Key, string> = {
	notLoggedIn: "ログインが必要",
	loginRequired: "Spotify へのログインが必要です",
	loginHint: "設定ページでログイン",
	noActiveDevice: "アクティブなデバイスなし",
	premiumRequired: "Premium が必要",
	volumeDisallowed: "音量を変更できないデバイス",
	forbidden: "権限がありません",
	rateLimited: "リクエスト過多、少々お待ちを",
	error: "エラー {0}",
	openingSpotify: "Spotify を起動中…",
	connectingSpotify: "Spotify に接続中…",
	noPlayback: "再生中のデバイスなし",
	notPlaying: "再生していません",
	unavailableTrack: "(再生できない曲)",
	scopeMissing: "権限が必要 · 設定ページで再ログイン",
	loading: "読み込み中…",
	loadFailed: "読み込み失敗",
	empty: "空です",
	tapBack: "‹ タップで戻る",
	addedToQueue: "✓ キューに追加しました",

	tokenFailed: "トークン取得に失敗 ({0}): {1}",
	badClientId: "Client ID の形式が正しくありません (16進数32文字)",
	accessDenied: "アクセスが拒否されました",
	loginExpired: "ログイン要求の有効期限が切れました。もう一度お試しください",
	loginTimeout: "ログインがタイムアウトしました",
	noCode: "認証コードがありません",

	library: "ライブラリ",
	nowPlaying: "再生中",
	upNext: "次に再生",
	queue: "キュー",
	queueEmpty: "キューは空です",
	myPlaylists: "マイプレイリスト",
	likedSongs: "お気に入りの曲",
	artists: "アーティスト",
	savedAlbums: "保存したアルバム",
	recent: "最近再生した曲",
	playAll: "すべて再生",
	playAlbum: "アルバムを再生",
	playArtist: "アーティストを再生",
	topTracks: "人気曲",
	artistTopTracks: "{0} の人気曲",
	single: "シングル",
	album: "アルバム",
	listeningNow: "再生中",
	following: "フォロー中",
	frequent: "よく聴く",
	artist: "アーティスト",
	noContext: "プレイリスト外で再生中",
	unsupportedContext: "未対応の再生形式 ({0})",
	noPlaylists: "プレイリストなし",
	noLiked: "お気に入りの曲なし",

	volume: "音量",
	shuffleOn: "シャッフル オン",
	shuffleOff: "シャッフル オフ",
	repeatOff: "リピート オフ",
	repeatAll: "全曲リピート",
	repeatOne: "1曲リピート",
	needsSetup: "要設定",
	noDevice: "デバイスなし",
	connected: "接続済み",
	settings: "設定",
	portInUse: "ポート {0} 使用中",
};

const dict: Record<Lang, Record<Key, string>> = { en, ko, ja };

/** Normalizes a language tag ("ko-KR", "ja", "en_US") to a supported language. */
export function pickLang(tag: string | undefined | null): Lang | undefined {
	const base = tag?.toLowerCase().split(/[-_]/)[0];
	return LANGS.find((l) => l === base);
}

/** The Stream Deck app's UI language. */
export function lang(): Lang {
	try {
		return pickLang(streamDeck.info.application.language) ?? "en";
	} catch {
		return "en";
	}
}

/** Translates `key`, replacing `{0}`, `{1}`… with `args`. */
export function t(key: Key, ...args: (string | number)[]): string {
	return tIn(lang(), key, ...args);
}

export function tIn(l: Lang, key: Key, ...args: (string | number)[]): string {
	return dict[l][key].replace(/\{(\d)\}/g, (_, i) => String(args[Number(i)] ?? ""));
}
