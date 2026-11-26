import { describe, expect, it } from "vitest";

import { marquee, textWidth } from "../src/render";

describe("textWidth", () => {
	it("treats Hangul and CJK as full width", () => {
		expect(textWidth("가", 10)).toBe(10);
		expect(textWidth("日", 10)).toBe(10);
		expect(textWidth("a", 10)).toBeLessThan(10);
	});
});

describe("marquee", () => {
	it("returns short text unchanged", () => {
		expect(marquee("Hello", 200, 13, 42)).toBe("Hello");
	});

	it("holds the start before scrolling", () => {
		const text = "A very long track title that does not fit on the strip";
		expect(marquee(text, 100, 13, 0).startsWith("A very")).toBe(true);
		expect(marquee(text, 100, 13, 5).startsWith("A very")).toBe(true);
	});

	it("advances one character per tick after the hold and loops", () => {
		const text = "A very long track title that does not fit on the strip";
		expect(marquee(text, 100, 13, 7).startsWith(" very")).toBe(true);
		const cycle = [...text].length + 5;
		expect(marquee(text, 100, 13, 6 + cycle)).toBe(marquee(text, 100, 13, 6));
	});
});
