import assert from "node:assert/strict";
import test from "node:test";

import { DateTime } from "luxon";

import { aggregateDailyContributions, buildHeatmapRenderModel, buildSnapshotFromEvents, type ForgejoHeatmapEvent } from "./forgejo-heatmap";

const timezone = "America/Chicago";

const seconds = (iso: string) => Math.trunc(DateTime.fromISO(iso, { zone: "utc" }).toSeconds());

test("aggregates multiple events within the same local day", () => {
	const events: ForgejoHeatmapEvent[] = [
		{ timestamp: seconds("2026-01-10T06:00:00Z"), contributions: 2 },
		{ timestamp: seconds("2026-01-10T18:00:00Z"), contributions: 3 }
	];

	const snapshot = buildSnapshotFromEvents(events, {
		timezone,
		weeks: 1,
		now: DateTime.fromISO("2026-01-10T12:00:00", { zone: timezone }),
		generatedAt: "2026-01-10T18:05:00Z"
	});

	const day = snapshot.days.find(item => item.date === "2026-01-10");
	assert.ok(day);
	assert.equal(day.count, 5);
});

test("keeps DST boundary contributions in the correct local day", () => {
	const events: ForgejoHeatmapEvent[] = [
		{ timestamp: seconds("2026-03-08T05:30:00Z"), contributions: 1 },
		{ timestamp: seconds("2026-03-08T07:30:00Z"), contributions: 2 },
		{ timestamp: seconds("2026-03-08T08:30:00Z"), contributions: 3 }
	];

	const daily = aggregateDailyContributions(events, timezone);
	assert.equal(daily.get("2026-03-07"), 1);
	assert.equal(daily.get("2026-03-08"), 5);
});

test("empty responses still build a zeroed window", () => {
	const snapshot = buildSnapshotFromEvents([], {
		timezone,
		weeks: 2,
		now: DateTime.fromISO("2026-02-15T12:00:00", { zone: timezone }),
		generatedAt: "2026-02-15T18:00:00Z"
	});

	assert.equal(snapshot.days.length, 14);
	assert.equal(snapshot.maxCount, 0);
	assert.equal(
		snapshot.days.every(day => day.count === 0),
		true
	);
});

test("integration fixture maps to snapshot contract", () => {
	const fixture: ForgejoHeatmapEvent[] = [
		{ timestamp: 1773935100, contributions: 2 },
		{ timestamp: 1773936000, contributions: 3 },
		{ timestamp: 1774023300, contributions: 1 }
	];

	const snapshot = buildSnapshotFromEvents(fixture, {
		timezone,
		weeks: 2,
		now: DateTime.fromISO("2026-03-21T12:00:00", { zone: timezone }),
		generatedAt: "2026-03-21T17:00:00Z"
	});

	assert.equal(snapshot.generatedAt, "2026-03-21T17:00:00Z");
	assert.equal(snapshot.timezone, timezone);
	assert.equal(snapshot.days.length, 14);
	assert.equal(typeof snapshot.maxCount, "number");
	assert.equal(typeof snapshot.stale, "boolean");
});

test("UI model renders a full grid and handles unavailable data", () => {
	const snapshot = buildSnapshotFromEvents([{ timestamp: seconds("2026-03-18T12:00:00Z"), contributions: 4 }], {
		timezone,
		weeks: 2,
		now: DateTime.fromISO("2026-03-21T12:00:00", { zone: timezone }),
		generatedAt: "2026-03-21T17:00:00Z",
		stale: false
	});

	const model = buildHeatmapRenderModel(snapshot, {
		weeks: 2,
		timezone,
		now: DateTime.fromISO("2026-03-21T12:00:00", { zone: timezone }),
		staleAfterHours: 36
	});

	assert.equal(model.cells.length, 14);
	assert.equal(model.available, true);
	assert.equal(model.stale, false);
	assert.equal(
		model.cells.some(cell => cell.count === 4),
		true
	);

	const unavailableModel = buildHeatmapRenderModel(null, {
		weeks: 2,
		timezone,
		now: DateTime.fromISO("2026-03-21T12:00:00", { zone: timezone })
	});

	assert.equal(unavailableModel.cells.length, 14);
	assert.equal(unavailableModel.available, false);
	assert.equal(unavailableModel.stale, true);
});
