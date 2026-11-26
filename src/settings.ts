/** Per-dial settings chosen in the property inspector. */
export type DialSettings = { seekStep?: number | string; volumeStep?: number | string };
export const SEEK_STEPS = [1, 2, 5, 10, 15, 30];
export const VOLUME_STEPS = [1, 2, 5, 10];

/** Reads a step setting, falling back to `def` for missing or unexpected values. */
export function stepSetting(value: number | string | undefined, allowed: number[], def: number): number {
	const n = Number(value);
	return allowed.includes(n) ? n : def;
}
