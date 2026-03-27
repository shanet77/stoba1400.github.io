import { DateTime } from "luxon";

export const DEFAULT_HEATMAP_TIMEZONE = "America/Chicago";
export const DEFAULT_HEATMAP_WEEKS = 53;
export const DEFAULT_HEATMAP_MONTHS = 4;

export interface ForgejoHeatmapEvent {
	timestamp: number;
	contributions: number;
}

export interface ForgejoHeatmapDay {
	date: string;
	count: number;
}

export interface ForgejoHeatmapSnapshot {
	generatedAt: string;
	timezone: string;
	days: ForgejoHeatmapDay[];
	maxCount: number;
	stale: boolean;
}

export interface HeatmapCell extends ForgejoHeatmapDay {
	level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapRenderModel {
	cells: HeatmapCell[];
	timezone: string;
	totalContributions: number;
	maxCount: number;
	stale: boolean;
	available: boolean;
}

interface SnapshotOptions {
	timezone?: string;
	weeks?: number;
	months?: number;
	now?: DateTime;
	generatedAt?: string;
	stale?: boolean;
}

interface RenderOptions {
	weeks?: number;
	months?: number;
	timezone?: string;
	now?: DateTime;
	staleAfterHours?: number;
}

export function alignToSaturday(now: DateTime): DateTime {
	const weekday = now.weekday % 7; // Luxon: Monday=1..Sunday=7 => 0 for Sunday
	const offset = (6 - weekday + 7) % 7;
	return now.plus({ days: offset }).startOf("day");
}

export function aggregateDailyContributions(events: ForgejoHeatmapEvent[], timezone: string): Map<string, number> {
	const byDay = new Map<string, number>();

	for (const event of events) {
		if (!Number.isFinite(event.timestamp) || !Number.isFinite(event.contributions)) continue;
		const date = DateTime.fromSeconds(event.timestamp, { zone: "utc" }).setZone(timezone).toISODate();
		if (!date) continue;
		byDay.set(date, (byDay.get(date) ?? 0) + Math.max(0, Math.trunc(event.contributions)));
	}

	return byDay;
}

export function buildSnapshotFromEvents(events: ForgejoHeatmapEvent[], options: SnapshotOptions = {}): ForgejoHeatmapSnapshot {
	const timezone = options.timezone ?? DEFAULT_HEATMAP_TIMEZONE;
	const weeks = options.weeks;
	const months = options.months ?? DEFAULT_HEATMAP_MONTHS;
	const now = options.now ?? DateTime.now().setZone(timezone);
	const generatedAt = options.generatedAt ?? DateTime.utc().toISO() ?? new Date().toISOString();
	const stale = options.stale ?? false;

	const end = alignToSaturday(now);
	const start =
		typeof weeks === "number"
			? end.minus({ days: Math.max(1, Math.trunc(weeks)) * 7 - 1 })
			: end.minus({ months: Math.max(1, Math.trunc(months)) }).plus({ days: 1 });
	const dailyContributions = aggregateDailyContributions(events, timezone);

	const days: ForgejoHeatmapDay[] = [];
	for (let cursor = start; cursor <= end; cursor = cursor.plus({ days: 1 })) {
		const date = cursor.toISODate();
		if (!date) continue;
		days.push({ date, count: dailyContributions.get(date) ?? 0 });
	}

	const maxCount = days.reduce((max, day) => Math.max(max, day.count), 0);

	return {
		generatedAt,
		timezone,
		days,
		maxCount,
		stale
	};
}

export function isValidSnapshot(input: unknown): input is ForgejoHeatmapSnapshot {
	if (typeof input !== "object" || input === null) return false;

	const candidate = input as Partial<ForgejoHeatmapSnapshot>;
	if (typeof candidate.generatedAt !== "string") return false;
	if (typeof candidate.timezone !== "string") return false;
	if (typeof candidate.maxCount !== "number") return false;
	if (typeof candidate.stale !== "boolean") return false;
	if (!Array.isArray(candidate.days)) return false;

	for (const day of candidate.days) {
		if (typeof day !== "object" || day === null) return false;
		const item = day as Partial<ForgejoHeatmapDay>;
		if (typeof item.date !== "string") return false;
		if (typeof item.count !== "number") return false;
	}

	return true;
}

export function isSnapshotStale(snapshot: ForgejoHeatmapSnapshot, options: Pick<RenderOptions, "now" | "staleAfterHours"> = {}): boolean {
	if (snapshot.stale) return true;

	const staleAfterHours = options.staleAfterHours ?? 36;
	const now = options.now ?? DateTime.utc();
	const generatedAt = DateTime.fromISO(snapshot.generatedAt, { zone: "utc" });

	if (!generatedAt.isValid) return true;
	return now.diff(generatedAt, "hours").hours > staleAfterHours;
}

function getIntensityLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
	if (count <= 0 || maxCount <= 0) return 0;

	const ratio = count / maxCount;
	if (ratio >= 0.75) return 4;
	if (ratio >= 0.5) return 3;
	if (ratio >= 0.25) return 2;
	return 1;
}

export function buildHeatmapRenderModel(snapshot: ForgejoHeatmapSnapshot | null | undefined, options: RenderOptions = {}): HeatmapRenderModel {
	const timezone = snapshot?.timezone ?? options.timezone ?? DEFAULT_HEATMAP_TIMEZONE;
	const weeks = options.weeks;
	const months = options.months ?? DEFAULT_HEATMAP_MONTHS;
	const now = options.now ?? DateTime.now().setZone(timezone);
	const staleAfterHours = options.staleAfterHours ?? 36;

	const fallback = buildSnapshotFromEvents([], {
		timezone,
		weeks,
		months,
		now,
		stale: true
	});

	const effective = snapshot ?? fallback;
	const stale = snapshot ? isSnapshotStale(snapshot, { now: now.setZone("utc"), staleAfterHours }) : true;
	const cells = effective.days.map(day => ({ ...day, level: getIntensityLevel(day.count, effective.maxCount) }));
	const totalContributions = cells.reduce((total, day) => total + day.count, 0);

	return {
		cells,
		timezone,
		totalContributions,
		maxCount: effective.maxCount,
		stale,
		available: Boolean(snapshot && snapshot.days.length > 0)
	};
}
