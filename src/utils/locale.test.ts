import assert from "node:assert/strict";
import test from "node:test";

import { entryParams, entryUrl, getRelativeLocaleUrl, isLiveEntry, localeOf, localePaths, slugOf } from "./locale";

test("default locale carries no prefix", () => {
	assert.equal(getRelativeLocaleUrl("en"), "/");
	assert.equal(getRelativeLocaleUrl("en", "/note"), "/note");
	assert.equal(getRelativeLocaleUrl("en", "note"), "/note");
});

test("entry urls hide the locale split", () => {
	assert.equal(entryUrl("en", "note", "hello"), "/note/hello");
	assert.equal(entryUrl("en", "jotting", "hello"), "/jotting/hello");
});

test("monolocale ids pass through untouched", () => {
	assert.equal(slugOf("hello"), "hello");
	assert.equal(localeOf("hello"), "en");
	assert.deepEqual(entryParams("hello"), { locale: undefined, id: "hello" });
});

test("draft entries are filtered out", () => {
	assert.equal(isLiveEntry({ id: "hello", data: { draft: true } }, "en"), false);
	assert.equal(isLiveEntry({ id: "hello", data: {} }, "en"), true);
});

test("locale paths omit the default locale", () => {
	assert.deepEqual(localePaths(), [{ params: { locale: undefined } }]);
});
