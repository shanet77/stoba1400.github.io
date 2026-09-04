import assert from "node:assert/strict";
import test from "node:test";

import { buildEmbedUrl, HOOPNERD_GAME_OVER_TYPE, HOOPNERD_READY_TYPE, parseHoopnerdMessage } from "./hoopnerd-embed";

const event = (origin: string, data: unknown) => ({ origin, data }) as MessageEvent;

test("accepts ready pings only from HoopNerd origins", () => {
	assert.deepEqual(parseHoopnerdMessage(event("https://hoopnerd.xyz", { type: HOOPNERD_READY_TYPE })), { kind: "ready" });
	assert.deepEqual(parseHoopnerdMessage(event("https://www.hoopnerd.xyz", { type: HOOPNERD_READY_TYPE })), { kind: "ready" });
	assert.deepEqual(parseHoopnerdMessage(event("https://evil.example", { type: HOOPNERD_READY_TYPE })), { kind: "ignore" });
});

test("accepts well-formed game-over payloads and clamps strings", () => {
	const result = parseHoopnerdMessage(
		event("https://hoopnerd.xyz", {
			type: HOOPNERD_GAME_OVER_TYPE,
			winnerName: "Shane",
			humanWon: true,
			moves: 7.9,
			reason: "CPU has no valid moves! You win!"
		})
	);
	assert.deepEqual(result, {
		kind: "game-over",
		result: { winnerName: "Shane", humanWon: true, moves: 7, reason: "CPU has no valid moves! You win!" }
	});
});

test("rejects malformed payloads and non-object data", () => {
	assert.deepEqual(parseHoopnerdMessage(event("https://hoopnerd.xyz", { type: HOOPNERD_GAME_OVER_TYPE, winnerName: "x" })), { kind: "ignore" });
	assert.deepEqual(parseHoopnerdMessage(event("https://hoopnerd.xyz", "hoopnerd:game-over")), { kind: "ignore" });
	assert.deepEqual(parseHoopnerdMessage(event("https://hoopnerd.xyz", { type: "other" })), { kind: "ignore" });
});

test("builds embed URLs with sanitized params", () => {
	assert.equal(buildEmbedUrl("https://hoopnerd.xyz", {}), "https://hoopnerd.xyz/embed/cpu");
	assert.equal(
		buildEmbedUrl("https://hoopnerd.xyz", { name: "  Shane  ", min: 1996, max: 1998 }),
		"https://hoopnerd.xyz/embed/cpu?name=Shane&min=1996&max=1998"
	);
	assert.equal(buildEmbedUrl("https://hoopnerd.xyz", { min: 2020, max: 2010 }), "https://hoopnerd.xyz/embed/cpu");
});
