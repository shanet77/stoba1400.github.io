import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import config, { monolocale } from "$config";
import { type LmkEndpoint, resolveLmkEndpoints } from "./lmk";

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
			url: getRelativeLocaleUrl(
				monolocale ? config.i18n.defaultLocale : note.id.split("/")[0],
				`/note/${monolocale ? note.id : note.id.split("/").slice(1).join("/")}`
			)
		})),
		config.author.email ? `${config.author.email} <${config.author.name}>` : undefined
	);
}
