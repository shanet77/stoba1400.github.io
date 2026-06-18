import { test } from "node:test";
import assert from "node:assert/strict";
import { yearsSince } from "./years-since";

test("yearsSince rounds fractional years to the nearest hundredth", () => {
	// 2022-08-22 -> 2026-06-17 = 1395 days = 3.8193... years -> 3.82
	assert.equal(yearsSince("2022-08-22", Date.parse("2026-06-17T00:00:00Z")), 3.82);
});

test("yearsSince yields a whole number on a Julian-aligned span", () => {
	// 2019-08-22 -> 2023-08-22 = exactly 1461 days = 4 * 365.25 days -> 4
	assert.equal(yearsSince("2019-08-22", Date.parse("2023-08-22T00:00:00Z")), 4);
});

test("yearsSince rounds down when the third decimal is below five", () => {
	// 2022-08-22 -> 2025-01-01 = 863 days = 2.3627... years -> 2.36
	assert.equal(yearsSince("2022-08-22", Date.parse("2025-01-01T00:00:00Z")), 2.36);
});

test("yearsSince throws on a malformed date", () => {
	assert.throws(() => yearsSince("not-a-date"));
});
