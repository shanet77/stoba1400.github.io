import type { Plugin } from "unified";
import type { Root, Text, Paragraph } from "mdast";
import { visit } from "unist-util-visit";

interface AbbrDefinition {
	abbr: string;
	title: string;
}

/**
 * Remark plugin to process abbreviations in markdown.
 *
 * Syntax: *[ABBR]: Definition
 * Example: *[HTML]: HyperText Markup Language
 *
 * This will convert all instances of "HTML" in the text to <abbr title="HyperText Markup Language">HTML</abbr>
 */
const remarkAbbr: Plugin<[], Root> = () => {
	return (tree: Root) => {
		const abbreviations: AbbrDefinition[] = [];

		// First pass: collect abbreviation definitions
		visit(tree, "paragraph", (node: Paragraph, index, parent) => {
			if (!node.children || node.children.length !== 1) return;

			const child = node.children[0];
			if (child.type !== "text") return;

			const text = child.value;
			const abbrMatch = text.match(/^\*\[([^\]]+)\]:\s*(.+)$/);

			if (abbrMatch) {
				const [, abbr, title] = abbrMatch;
				abbreviations.push({ abbr: abbr.trim(), title: title.trim() });

				// Remove the abbreviation definition from the tree
				if (parent && typeof index === "number") {
					parent.children.splice(index, 1);
					// Continue at the same index so the node that shifted into
					// this slot (e.g. an adjacent definition) is still visited
					return index;
				}
			}
		});

		// Second pass: replace abbreviations in text nodes
		if (abbreviations.length > 0) {
			// Compile each abbreviation's regex once per document instead of once per text node
			const patterns = abbreviations.map(({ abbr, title }) => ({
				regex: new RegExp(`\\b${escapeRegExp(abbr)}\\b`, "g"),
				replacement: `<abbr title="${escapeHtml(title)}">${abbr}</abbr>`
			}));

			visit(tree, "text", (node: Text, index, parent) => {
				if (typeof index !== "number" || !parent) return;

				let text = node.value;

				for (const { regex, replacement } of patterns) {
					text = text.replace(regex, replacement);
				}

				if (text !== node.value) {
					parent.children[index] = {
						type: "html",
						value: text
					};
				}
			});
		}
	};
};

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default remarkAbbr;
