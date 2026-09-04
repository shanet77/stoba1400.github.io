export const HOOPNERD_ORIGIN = "https://hoopnerd.xyz";
export const HOOPNERD_WWW_ORIGIN = "https://www.hoopnerd.xyz";
export const HOOPNERD_EMBED_ORIGINS = [HOOPNERD_ORIGIN, HOOPNERD_WWW_ORIGIN];

export const HOOPNERD_READY_TYPE = "hoopnerd:ready";
export const HOOPNERD_GAME_OVER_TYPE = "hoopnerd:game-over";

export interface HoopnerdGameOver {
	winnerName: string;
	humanWon: boolean;
	moves: number;
	reason: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

interface GameOverWirePayload {
	type: typeof HOOPNERD_GAME_OVER_TYPE;
	winnerName: string;
	humanWon: boolean;
	moves: number;
	reason: string;
}

const isGameOverPayload = (data: unknown): data is GameOverWirePayload =>
	isRecord(data) &&
	data.type === HOOPNERD_GAME_OVER_TYPE &&
	typeof data.winnerName === "string" &&
	typeof data.humanWon === "boolean" &&
	typeof data.moves === "number" &&
	typeof data.reason === "string";

const toNonNegativeInt = (value: number): number => (Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);

/**
 * Validate an inbound postMessage event from the HoopNerd embed.
 * Returns a discriminated result so callers can distinguish "not ours"
 * from "ours but malformed" without ever trusting event.data blindly.
 */
export function parseHoopnerdMessage(event: MessageEvent): { kind: "ready" } | { kind: "game-over"; result: HoopnerdGameOver } | { kind: "ignore" } {
	if (!HOOPNERD_EMBED_ORIGINS.includes(event.origin)) return { kind: "ignore" };
	if (!isRecord(event.data)) return { kind: "ignore" };

	if (event.data.type === HOOPNERD_READY_TYPE) return { kind: "ready" };
	if (!isGameOverPayload(event.data)) return { kind: "ignore" };

	return {
		kind: "game-over",
		result: {
			winnerName: event.data.winnerName.slice(0, 32),
			humanWon: event.data.humanWon,
			moves: toNonNegativeInt(event.data.moves),
			reason: event.data.reason.slice(0, 200)
		}
	};
}

export function buildEmbedUrl(origin: string, params: { name?: string; min?: number; max?: number }): string {
	const url = new URL("/embed/cpu", origin);
	if (params.name?.trim()) url.searchParams.set("name", params.name.trim().slice(0, 32));
	if (
		params.min !== undefined &&
		params.max !== undefined &&
		Number.isFinite(params.min) &&
		Number.isFinite(params.max) &&
		params.min <= params.max
	) {
		url.searchParams.set("min", String(Math.trunc(params.min)));
		url.searchParams.set("max", String(Math.trunc(params.max)));
	}
	return url.toString();
}
