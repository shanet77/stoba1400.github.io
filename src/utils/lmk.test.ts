import assert from "node:assert/strict";
import test from "node:test";

import { endpointForNote, resolveLmkEndpoints } from "./lmk";

const note = (id: string, title: string, date: string, series?: string) => ({
	id,
	title,
	timestamp: new Date(date),
	series,
	url: `/note/${id}`
});

test("newest post in a series owns the pending endpoint", () => {
	const endpoints = resolveLmkEndpoints([note("p1", "Part 1", "2025-01-01", "Homelabbing"), note("p2", "Part 2", "2025-02-01", "Homelabbing")]);
	assert.equal(endpoints.length, 2);
	assert.equal(endpointForNote("p1", endpoints)?.happened, true);
	assert.equal(endpointForNote("p2", endpoints)?.happened, false);
});

test("fired endpoint points at its successor", () => {
	const endpoints = resolveLmkEndpoints([note("p1", "Part 1", "2025-01-01", "S"), note("p2", "Part 2", "2025-02-01", "S")]);
	const fired = endpointForNote("p1", endpoints)!;
	assert.equal(fired.message, "“Part 2” is out — the next post in “S”.");
	assert.deepEqual(fired.actions, [{ label: "Read the post", url: "/note/p2" }]);
});

test("posts without a series get no endpoint", () => {
	assert.deepEqual(resolveLmkEndpoints([note("solo", "Solo", "2025-01-01")]), []);
});

test("publishing a third post flips the middle one to fired", () => {
	const endpoints = resolveLmkEndpoints([
		note("p1", "Part 1", "2025-01-01", "S"),
		note("p2", "Part 2", "2025-02-01", "S"),
		note("p3", "Part 3", "2025-03-01", "S")
	]);
	assert.equal(endpointForNote("p2", endpoints)?.happened, true);
	assert.equal(endpointForNote("p2", endpoints)?.actions?.[0].url, "/note/p3");
	assert.equal(endpointForNote("p3", endpoints)?.happened, false);
});
