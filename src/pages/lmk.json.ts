import type { APIRoute } from "astro";
import { LMK_VERSION } from "$utils/lmk";
import { loadLmkEndpoints } from "$utils/lmk-endpoints";

export const GET: APIRoute = async () => {
	const endpoints = await loadLmkEndpoints();
	return new Response(
		JSON.stringify(
			{
				lmk: LMK_VERSION,
				endpoints: endpoints.map(({ noteId, ...e }) => e)
			},
			null,
			2
		),
		{ headers: { "Content-Type": "application/json" } }
	);
};
