import { test } from "node:test";
import assert from "node:assert/strict";
import { u } from "unist-builder";
import { unified } from "unified";
import type { Root } from "mdast";
import remarkAbbr from "./abbr";

/** Run the plugin over a hand-built mdast tree via unified (handles plugin `this` binding). */
const transform = (tree: Root): Root => unified().use(remarkAbbr).runSync(tree) as Root;

const text = (value: string) => u("text", value);
const paragraph = (...children: any[]) => u("paragraph", children);

/** Definition paragraph: a single text child matching `*[ABBR]: title`. */
const definition = (abbr: string, title: string) => paragraph(text(`*[${abbr}]: ${title}`));

/** Collect the `value` of every html node in the tree. */
const htmlValues = (node: any): string[] => (node.type === "html" ? [node.value] : (node.children ?? []).flatMap(htmlValues));

test("replaces whole-word abbreviations with abbr tags", () => {
	const tree = transform(u("root", [definition("HTML", "HyperText Markup Language"), paragraph(text("HTML is a markup language."))]));
	const html = htmlValues(tree);
	assert.equal(html.length, 1);
	assert.equal(html[0], '<abbr title="HyperText Markup Language">HTML</abbr> is a markup language.');
});

test("removes the abbreviation definition paragraph", () => {
	const tree = transform(u("root", [definition("HTML", "HyperText Markup Language"), paragraph(text("Use HTML."))]));
	assert.equal(tree.children.length, 1);
	assert.equal(tree.children[0].type, "paragraph");
});

test("does not match substrings inside longer words", () => {
	const tree = transform(u("root", [definition("HTML", "HyperText Markup Language"), paragraph(text("HTMLish is not HTML."))]));
	const html = htmlValues(tree);
	assert.equal(html.length, 1);
	assert.equal(html[0], 'HTMLish is not <abbr title="HyperText Markup Language">HTML</abbr>.');
});

test("handles multiple abbreviations in one document", () => {
	const tree = transform(
		u("root", [
			definition("HTML", "HyperText Markup Language"),
			definition("CSS", "Cascading Style Sheets"),
			paragraph(text("HTML and CSS together."))
		])
	);
	const html = htmlValues(tree);
	assert.equal(html.length, 1);
	assert.equal(html[0], '<abbr title="HyperText Markup Language">HTML</abbr> and <abbr title="Cascading Style Sheets">CSS</abbr> together.');
	// Both definition paragraphs removed
	assert.equal(tree.children.length, 1);
});

test("escapes HTML in the title attribute", () => {
	const tree = transform(u("root", [definition("X", 'a "quoted" <thing> & more'), paragraph(text("X marks it."))]));
	const html = htmlValues(tree);
	assert.equal(html[0], '<abbr title="a &quot;quoted&quot; &lt;thing&gt; &amp; more">X</abbr> marks it.');
});

test("leaves text untouched when no abbreviations are defined", () => {
	const tree = transform(u("root", [paragraph(text("Just some text with HTML in it."))]));
	assert.equal(htmlValues(tree).length, 0);
	assert.equal((tree.children[0] as any).children?.[0]?.type, "text");
});

test("replaces abbreviations inside nested phrasing content", () => {
	const tree = transform(
		u("root", [definition("HTML", "HyperText Markup Language"), u("paragraph", [text("Use "), u("strong", [text("HTML")]), text(" here.")])])
	);
	const html = htmlValues(tree);
	assert.equal(html.length, 1);
	assert.equal(html[0], '<abbr title="HyperText Markup Language">HTML</abbr>');
	// The strong wrapper survives (paragraph is now tree.children[0] after the definition was removed)
	assert.equal((tree.children[0] as any).children?.[1]?.type, "strong");
});
