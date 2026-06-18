import { visit } from "unist-util-visit";
import type { Visitor } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Parent, Root, Text } from "mdast";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export const REGEX = /\{\{years-since\s+(\d{4}-\d{2}-\d{2})\s*\}\}/;
const REGEX_GLOBAL = new RegExp(REGEX.source, "g");

export function yearsSince(isoDate: string, now: number = Date.now()): number {
	const start = Date.parse(isoDate);
	if (Number.isNaN(start)) {
		throw new Error(`years-since: invalid date "${isoDate}". Expected YYYY-MM-DD.`);
	}
	return Number(((now - start) / MS_PER_YEAR).toFixed(2));
}

const visitor: Visitor<Text, Parent> = node => {
	if (!REGEX.test(node.value)) return;
	node.value = node.value.replace(REGEX_GLOBAL, (_, isoDate: string) => String(yearsSince(isoDate)));
};

/**
 * Remark plugin that replaces `{{years-since YYYY-MM-DD}}` placeholders with the
 * number of years elapsed since the given date, rounded to the nearest hundredth.
 *
 * Example: `~{{years-since 2022-08-22}} years` -> `~3.82 years`
 *
 * The value is computed at build time, so it updates whenever the site is rebuilt.
 */
export const plugin: Plugin<[], Root> = () => {
	const transformer: Transformer<Root> = tree => {
		visit(tree, "text", visitor);
	};
	return transformer;
};

export default plugin;
