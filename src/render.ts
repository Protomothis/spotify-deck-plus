/** Rendering helpers: SVG key images and album-art data URLs. */

export const GREEN = "#1ed760";
export const DIM = "#8a8a8a";

/** 24×24 glyph paths (own drawings, plain geometry). */
export const glyph = {
	play: "M8 5.5v13a.8.8 0 0 0 1.2.7l10.2-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z",
	pause: "M6.5 5h3.5v14H6.5zM14 5h3.5v14H14z",
	prev: "M6 5.5h2.2v13H6zM19 6v12a.7.7 0 0 1-1.1.6L9.8 12.6a.7.7 0 0 1 0-1.2l8.1-6A.7.7 0 0 1 19 6z",
	next: "M15.8 5.5H18v13h-2.2zM5 6v12a.7.7 0 0 0 1.1.6l8.1-6a.7.7 0 0 0 0-1.2l-8.1-6A.7.7 0 0 0 5 6z",
	heart:
		"M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z",
	heartOutline:
		"M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4zm0-2.5c2.4-1.6 6.3-4.6 7.3-7.5.7-2.2-.6-4-2.5-4-1.5 0-2.7 1-3.6 2.6L12 10.6l-1.2-1.5C9.9 7.5 8.7 6.5 7.2 6.5c-1.9 0-3.2 1.8-2.5 4 1 2.9 4.9 5.9 7.3 7.5z",
	shuffle:
		"M3 6.5h3.4c1.6 0 3 .8 3.9 2.1l4.4 6.6c.5.8 1.4 1.3 2.4 1.3H18v-2.2l3.5 3.2-3.5 3.2v-2.2h-.9c-1.6 0-3-.8-3.9-2.1L8.8 9.8c-.5-.8-1.4-1.3-2.4-1.3H3zm0 11h3.4c1 0 1.9-.5 2.4-1.3l.9-1.3 1.2 1.8-.4.6c-.9 1.3-2.4 2.2-4.1 2.2H3zM17.1 6.5h.9V4.3l3.5 3.2-3.5 3.2V8.5h-.9c-1 0-1.9.5-2.4 1.3l-.9 1.3-1.2-1.8.4-.6c.9-1.3 2.4-2.2 4.1-2.2z",
	repeat:
		"M6 8.5h10.5V6.3L20 9.5l-3.5 3.2v-2.2H7v3H5v-4a1 1 0 0 1 1-1zm12 7H7.5v2.2L4 14.5l3.5-3.2v2.2H17v-3h2v4a1 1 0 0 1-1 1z",
	playlistAdd: "M3 6h12v2H3zm0 4.5h12v2H3zM3 15h8v2H3zm14-2h2v3h3v2h-3v3h-2v-3h-3v-2h3z",
	speaker:
		"M7 2.5h10a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V4A1.5 1.5 0 0 1 7 2.5zm5 2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm0 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 2.2a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6z",
	volume: "M3 9.5h3.5L11 5v14l-4.5-4.5H3zm11.2-1.6a5.5 5.5 0 0 1 0 8.2l-1.4-1.4a3.5 3.5 0 0 0 0-5.4zm2.8-2.8a9.5 9.5 0 0 1 0 13.8l-1.4-1.4a7.5 7.5 0 0 0 0-11z",
	mute: "M3 9.5h3.5L11 5v14l-4.5-4.5H3zm11.3-.3 2.2 2.2 2.2-2.2 1.4 1.4-2.2 2.2 2.2 2.2-1.4 1.4-2.2-2.2-2.2 2.2-1.4-1.4 2.2-2.2-2.2-2.2z",
	list: "M3 6h12v2H3zm0 4.5h12v2H3zM3 15h8v2H3zm14-9h4v2h-2.5v8.5a2.5 2.5 0 1 1-1.5-2.3z",
	spotify:
		"M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm4.3 13.7a.6.6 0 0 1-.8.2c-2.3-1.4-5.1-1.7-8.5-.9a.6.6 0 1 1-.3-1.2c3.7-.8 6.8-.5 9.4 1.1.3.2.4.5.2.8zm1.2-2.6a.7.7 0 0 1-1 .2c-2.6-1.6-6.6-2.1-9.7-1.1a.7.7 0 1 1-.4-1.4c3.5-1.1 7.9-.6 10.9 1.3.3.2.4.7.2 1zm.1-2.7C14.5 9 9.4 8.8 6.4 9.7a.9.9 0 1 1-.5-1.7c3.4-1 9-.8 12.6 1.3a.9.9 0 0 1-.9 1.6z",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const toDataUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export type KeyImage = {
	glyph?: string;
	color?: string;
	/** Album art data URL to use as the background. */
	art?: string;
	label?: string;
	/** Small badge text in the top-right corner (e.g. "1" for repeat-one). */
	badge?: string;
	bg?: string;
};

/** Builds a 144×144 key image. */
export function keyImage({ glyph: g, color = "#ffffff", art, label, badge, bg = "#141414" }: KeyImage): string {
	const size = 72;
	const y = label ? 26 : 36;
	const parts = [`<rect width="144" height="144" fill="${bg}"/>`];
	if (art) {
		parts.push(`<image href="${art}" width="144" height="144" preserveAspectRatio="xMidYMid slice"/>`);
		parts.push(`<rect width="144" height="144" fill="#000" opacity="0.45"/>`);
	}
	if (g) parts.push(`<g transform="translate(${(144 - size) / 2} ${y}) scale(${size / 24})"><path fill="${color}" d="${g}"/></g>`);
	if (badge) {
		parts.push(`<circle cx="112" cy="34" r="15" fill="${color}"/>`);
		parts.push(`<text x="112" y="40" font-family="-apple-system,Helvetica,sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="#141414">${esc(badge)}</text>`);
	}
	if (label) {
		const text = label.length > 11 ? `${label.slice(0, 10)}…` : label;
		parts.push(
			`<text x="72" y="128" font-family="-apple-system,'Apple SD Gothic Neo',Helvetica,sans-serif" font-size="19" font-weight="600" text-anchor="middle" fill="#ffffff">${esc(text)}</text>`,
		);
	}
	return toDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">${parts.join("")}</svg>`);
}

/** Small icon (for dial touch-strip pixmaps). */
export function iconSvg(g: string, color = "#ffffff", size = 48): string {
	return toDataUrl(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${color}" d="${g}"/></svg>`,
	);
}

/** Loading spinner key image; `frame` advances the arc by 30°. */
export function spinnerImage(frame: number, color = GREEN): string {
	const a = (frame * 30) % 360;
	return toDataUrl(
		`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#141414"/>` +
			`<circle cx="72" cy="72" r="30" fill="none" stroke="#2e2e2e" stroke-width="9"/>` +
			`<path transform="rotate(${a} 72 72)" d="M72 42a30 30 0 0 1 30 30" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/></svg>`,
	);
}

const artCache = new Map<string, Promise<string | undefined>>();

/** Fetches album art and returns it as a base64 data URL (cached). */
export function fetchArt(url: string | undefined): Promise<string | undefined> {
	if (!url) return Promise.resolve(undefined);
	let p = artCache.get(url);
	if (!p) {
		p = fetch(url)
			.then(async (r) => (r.ok ? `data:${r.headers.get("content-type") ?? "image/jpeg"};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}` : undefined))
			.catch(() => undefined);
		artCache.set(url, p);
		if (artCache.size > 30) artCache.delete(artCache.keys().next().value!);
	}
	return p;
}

export const fmtTime = (ms: number) => {
	const s = Math.max(0, Math.floor(ms / 1000));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ---------------------------------------------------------------- Marquee

/** Rough glyph width in px for the Stream Deck touch-strip font (no metrics are available). */
function charWidth(ch: string, size: number): number {
	const c = ch.codePointAt(0) ?? 0;
	if (ch === " ") return size * 0.3;
	// Hangul, CJK, kana, full-width forms render roughly square.
	if ((c >= 0x1100 && c <= 0x11ff) || (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xac00 && c <= 0xd7af) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xffef)) {
		return size;
	}
	if ("ilI.,:;'|!".includes(ch)) return size * 0.3;
	if ("mwMW@".includes(ch)) return size * 0.85;
	return size * 0.58;
}

export const textWidth = (text: string, size: number) => [...text].reduce((w, ch) => w + charWidth(ch, size), 0);

const MARQUEE_GAP = "     ";
/** Ticks to hold the start of the text before it begins to scroll. */
const MARQUEE_HOLD = 6;

/**
 * Returns the visible window of `text` for a slowly scrolling marquee. Text that fits is returned
 * unchanged; longer text holds at the start, then advances one character per tick and loops.
 */
export function marquee(text: string, width: number, size: number, tick: number): string {
	if (textWidth(text, size) <= width) return text;
	const chars = [...text, ...MARQUEE_GAP];
	const cycle = chars.length;
	const step = Math.max(0, tick - MARQUEE_HOLD) % cycle;
	// Hold again briefly each time the loop returns to the start.
	const offset = tick < MARQUEE_HOLD ? 0 : step;
	let out = "";
	let w = 0;
	for (let i = 0; w < width + size; i++) {
		const ch = chars[(offset + i) % cycle];
		w += charWidth(ch, size);
		out += ch;
	}
	return out;
}
