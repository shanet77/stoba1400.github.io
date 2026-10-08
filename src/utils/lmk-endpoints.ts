import { getCollection } from "astro:content";
import config from "$config";
import { type LmkEndpoint, resolveLmkEndpoints } from "./lmk";
import { entryUrl, localeOf } from "./locale";

export type { LmkEndpoint };
export { endpointForNote } from "./lmk";

export async function loadLmkEndpoints(): Promise<LmkEndpoint[]> {
	const notes = await getCollection("note", note => !note.data.draft);
	return resolveLmkEndpoints(
		notes.map(note => ({
			id: note.id,
			title: note.data.title,
			timestamp: note.data.timestamp,
			series: note.data.series,
			description: note.data.description,
			url: entryUrl(localeOf(note.id), "note", note.id)
		})),
		config.author.email ? `${config.author.email} <${config.author.name}>` : undefined
	);
}
