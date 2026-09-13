export interface LmkNote {
	id: string;
	title: string;
	timestamp: Date;
	series?: string;
	description?: string;
	url: string;
}

export interface LmkEndpoint {
	id: string;
	url: string;
	noteId: string;
	happened: boolean;
	purpose: string;
	contact?: string;
	created?: string;
	delay?: number;
	when?: string;
	message?: string;
	actions?: { label: string; url: string }[];
}

export const LMK_VERSION = "1.0";
export const LMK_DELAY = 86400;

const slug = (s: string) =>
	s
		.toLowerCase()
		.normalize("NFKC")
		.replace(/[^\p{L}\p{N}\s-]+/gu, "")
		.trim()
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");

/**
 * One "next in <series>" endpoint per post in a series. An endpoint is pending
 * only on the newest post; publishing a new post flips every older endpoint
 * to fired (pointing at its successor) on the next build.
 */
export function resolveLmkEndpoints(notes: LmkNote[], contact?: string): LmkEndpoint[] {
	const bySeries = new Map<string, LmkNote[]>();
	for (const note of notes) {
		if (!note.series) continue;
		const list = bySeries.get(note.series) ?? [];
		list.push(note);
		bySeries.set(note.series, list);
	}

	const endpoints: LmkEndpoint[] = [];
	for (const [series, list] of bySeries) {
		const ordered = [...list].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
		ordered.forEach((post, i) => {
			const next = ordered[i + 1];
			endpoints.push({
				id: `${slug(series)}-${i + 1}`,
				url: `/lmk/${slug(series)}-${i + 1}.json`,
				noteId: post.id,
				happened: next !== undefined,
				purpose: `Next post in the “${series}” series after “${post.title}”`,
				contact,
				created: post.timestamp.toISOString().slice(0, 10),
				...(next
					? {
							when: next.timestamp.toISOString(),
							message: `“${next.title}” is out, the next post in “${series}”.`,
							actions: [{ label: "Read the post", url: next.url }]
						}
					: { delay: LMK_DELAY })
			});
		});
	}
	return endpoints.sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function endpointForNote(noteId: string, endpoints: LmkEndpoint[]): LmkEndpoint | undefined {
	return endpoints.find(e => e.noteId === noteId);
}
