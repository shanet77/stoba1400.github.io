<script lang="ts">
import { onMount } from "svelte";
import { DateTime } from "luxon";
import i18nit from "$i18n";
import Time from "$utils/time";
import { buildHeatmapRenderModel, isValidSnapshot, type ForgejoHeatmapSnapshot, type HeatmapCell } from "$utils/forgejo-heatmap";

let {
	locale,
	months = 4,
	endpoint = "/data/forgejo-heatmap.json",
	staleAfterHours = 36
}: {
	locale: string;
	months?: number;
	endpoint?: string;
	staleAfterHours?: number;
} = $props();

const t = i18nit(locale);
const defaultTimezone = Time.defaultTimezone || "UTC";

let loading = $state(true);
let unavailable = $state(false);
let snapshot = $state<ForgejoHeatmapSnapshot | null>(null);

const model = $derived(
	buildHeatmapRenderModel(snapshot, {
		months,
		timezone: snapshot?.timezone ?? defaultTimezone,
		staleAfterHours
	})
);

function levelClass(cell: HeatmapCell): string {
	switch (cell.level) {
		case 4:
			return "opacity-100";
		case 3:
			return "opacity-75";
		case 2:
			return "opacity-55";
		case 1:
			return "opacity-35";
		default:
			return "opacity-10";
	}
}

function localizedDate(date: string, timezone: string): string {
	return DateTime.fromISO(date, { zone: timezone }).setLocale(locale).toLocaleString(DateTime.DATE_MED);
}

async function loadSnapshot(): Promise<void> {
	loading = true;
	unavailable = false;

	try {
		const response = await fetch(endpoint, { headers: { accept: "application/json" } });
		if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`);

		const payload: unknown = await response.json();
		if (!isValidSnapshot(payload)) throw new Error("Snapshot schema is invalid");

		snapshot = payload;
		unavailable = false;
	} catch {
		snapshot = null;
		unavailable = true;
	} finally {
		loading = false;
	}
}

onMount(() => {
	void loadSnapshot();
});
</script>

<div class="flex flex-col gap-2" aria-live="polite">
	{#if loading}
		<p class="text-size-xs c-remark">{t("home.heatmap.loading")}</p>
	{/if}

	{#if unavailable}
		<p class="text-size-xs c-remark">{t("home.heatmap.unavailable")}</p>
	{/if}

	{#if !loading && !unavailable && model.stale}
		<p class="text-size-xs c-remark">{t("home.heatmap.stale")}</p>
	{/if}

	<section class="grid grid-flow-col grid-rows-7 gap-1" aria-label={t("home.heatmap.aria")} aria-busy={loading}>
		{#each model.cells as cell}
			<figure class="relative group">
				<i class={`block w-2.5 h-2.5 bg-primary ${levelClass(cell)}`}></i>

				<div class="absolute left-0 bottom-full w-max -translate-x-1/2 flex flex-col mb-1 rd-1 px-2 py-2 text-size-xs c-background bg-primary pop">
					<time class="font-bold">{localizedDate(cell.date, model.timezone)}</time>
					<p class="mt-1">{t("home.heatmap.contribution", { count: cell.count })}</p>
				</div>
			</figure>
		{/each}
	</section>

	<p class="text-size-xs c-remark">{t("home.heatmap.total", { count: model.totalContributions })}</p>
	{#if snapshot}
		<p class="text-size-xs c-remark">{t("home.heatmap.updated", { time: Time(snapshot.generatedAt, snapshot.timezone) })}</p>
	{/if}
</div>
