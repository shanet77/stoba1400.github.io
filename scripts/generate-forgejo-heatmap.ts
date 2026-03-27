import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DateTime } from "luxon";

import {
	buildSnapshotFromEvents,
	DEFAULT_HEATMAP_MONTHS,
	DEFAULT_HEATMAP_TIMEZONE,
	isValidSnapshot,
	type ForgejoHeatmapEvent,
	type ForgejoHeatmapSnapshot
} from "../src/utils/forgejo-heatmap";

const endpoint = process.env.FORGEJO_HEATMAP_URL ?? "https://forge.shanenet.xyz/api/v1/users/shane/heatmap";
const timezone = process.env.FORGEJO_HEATMAP_TIMEZONE ?? DEFAULT_HEATMAP_TIMEZONE;
const months = Number(process.env.FORGEJO_HEATMAP_MONTHS ?? DEFAULT_HEATMAP_MONTHS);
const weeks = process.env.FORGEJO_HEATMAP_WEEKS ? Number(process.env.FORGEJO_HEATMAP_WEEKS) : undefined;
const outputPath = process.env.FORGEJO_HEATMAP_OUTPUT ?? "public/data/forgejo-heatmap.json";
const timeoutMs = Number(process.env.FORGEJO_HEATMAP_TIMEOUT_MS ?? "10000");
const failOnError = process.env.FORGEJO_HEATMAP_FAIL_ON_ERROR === "1";

function parseEvents(input: unknown): ForgejoHeatmapEvent[] {
	if (!Array.isArray(input)) throw new Error("Forgejo heatmap response is not an array");

	return input.flatMap(item => {
		if (typeof item !== "object" || item === null) return [];
		const candidate = item as Partial<ForgejoHeatmapEvent>;
		if (!Number.isFinite(candidate.timestamp) || !Number.isFinite(candidate.contributions)) return [];
		return [{ timestamp: Number(candidate.timestamp), contributions: Number(candidate.contributions) }];
	});
}

async function readExistingSnapshot(pathname: string): Promise<ForgejoHeatmapSnapshot | null> {
	try {
		const content = await readFile(pathname, "utf8");
		const parsed: unknown = JSON.parse(content);
		return isValidSnapshot(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

async function fetchEvents(url: string): Promise<ForgejoHeatmapEvent[]> {
	const response = await fetch(url, {
		headers: { accept: "application/json" },
		signal: AbortSignal.timeout(timeoutMs)
	});

	if (!response.ok) throw new Error(`Forgejo request failed: ${response.status}`);
	return parseEvents(await response.json());
}

async function main() {
	const now = DateTime.now().setZone(timezone);
	const generatedAt = DateTime.utc().toISO() ?? new Date().toISOString();

	let snapshot: ForgejoHeatmapSnapshot;
	let fetchError: Error | null = null;

	try {
		const events = await fetchEvents(endpoint);
		snapshot = buildSnapshotFromEvents(events, { timezone, weeks, months, now, generatedAt, stale: false });
	} catch (error) {
		fetchError = error as Error;
		const existingSnapshot = await readExistingSnapshot(outputPath);

		if (existingSnapshot) {
			snapshot = {
				...existingSnapshot,
				timezone,
				generatedAt,
				stale: true
			};
		} else {
			snapshot = buildSnapshotFromEvents([], { timezone, weeks, months, now, generatedAt, stale: true });
		}
	}

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

	console.log(
		JSON.stringify(
			{
				outputPath,
				timezone: snapshot.timezone,
				stale: snapshot.stale,
				maxCount: snapshot.maxCount,
				totalContributions: snapshot.days.reduce((total, day) => total + day.count, 0)
			},
			null,
			2
		)
	);

	if (fetchError) {
		console.error(`Heatmap fetch failed: ${fetchError.message}`);
		if (failOnError) process.exitCode = 1;
	}
}

void main();
