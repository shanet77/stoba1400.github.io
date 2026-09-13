import type { APIRoute } from "astro";
import { LMK_VERSION } from "$utils/lmk";
import { loadLmkEndpoints } from "$utils/lmk-endpoints";

export async function getStaticPaths() {
	const endpoints = await loadLmkEndpoints();
	return endpoints.map(endpoint => ({ params: { id: endpoint.id }, props: { endpoint } }));
}

export const GET: APIRoute = ({ props }) => {
	const { endpoint } = props as any;
	const { noteId, ...body } = endpoint;
	return new Response(JSON.stringify({ lmk: LMK_VERSION, ...body }, null, 2), {
		headers: { "Content-Type": "application/json" }
	});
};
