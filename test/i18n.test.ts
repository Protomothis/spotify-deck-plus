import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { LANGS, pickLang, tIn } from "../src/i18n";
import { PAGE_TEXT } from "../src/server";
import { SEEK_STEPS, stepSetting } from "../src/settings";
import { tasklistHasSpotify } from "../src/spotify/local";

const PLUGIN_DIR = path.resolve(__dirname, "../com.protomothis.spotify-deck-plus.sdPlugin");
const manifest = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR, "manifest.json"), "utf8"));

describe("i18n", () => {
	it("maps language tags", () => {
		expect(pickLang("ko-KR")).toBe("ko");
		expect(pickLang("ja_JP")).toBe("ja");
		expect(pickLang("de")).toBeUndefined();
	});

	it("formats placeholders", () => {
		expect(tIn("en", "error", 404)).toBe("Error 404");
		expect(tIn("ko", "artistTopTracks", "IU")).toBe("IU 인기곡");
	});

	it("settings page has the same keys in every language", () => {
		const keys = Object.keys(PAGE_TEXT.en).sort();
		for (const l of LANGS) expect(Object.keys(PAGE_TEXT[l]).sort()).toEqual(keys);
	});

	for (const l of LANGS) {
		it(`${l}.json covers every action`, () => {
			const loc = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR, `${l}.json`), "utf8"));
			expect(loc.Name).toBeTruthy();
			expect(loc.Description).toBeTruthy();
			for (const a of manifest.Actions) {
				const entry = loc[a.UUID];
				expect(entry, a.UUID).toBeDefined();
				expect(entry.Name).toBeTruthy();
				expect(entry.Tooltip).toBeTruthy();
				if (a.Controllers.includes("Encoder")) {
					expect(Object.keys(entry.Encoder.TriggerDescription).sort()).toEqual(Object.keys(a.Encoder.TriggerDescription).sort());
				}
			}
		});
	}
});

describe("dial steps", () => {
	it("accepts allowed values and falls back otherwise", () => {
		expect(stepSetting(10, SEEK_STEPS, 5)).toBe(10);
		expect(stepSetting("15", SEEK_STEPS, 5)).toBe(15);
		expect(stepSetting(7, SEEK_STEPS, 5)).toBe(5);
		expect(stepSetting(undefined, SEEK_STEPS, 5)).toBe(5);
	});
});

describe("Windows process detection", () => {
	it("finds Spotify in tasklist CSV output", () => {
		expect(tasklistHasSpotify('"Spotify.exe","12345","Console","1","180,000 K"\r\n')).toBe(true);
		expect(tasklistHasSpotify("INFO: No tasks are running which match the specified criteria.\r\n")).toBe(false);
	});
});
