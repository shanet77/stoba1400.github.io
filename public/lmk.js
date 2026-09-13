// biome-ignore-all lint/style/useNamingConvention: HTTP header name and public API constants (VERSION, DEFAULT_DELAY)
/* "Let Me Know" reference client.
 * Browser: <script src="lmk.js"></script> -> window.LMK
 * Node: require("./lmk.js") -> pure helpers
 */

(g => {
	var VERSION = "1.0";
	var DEFAULT_DELAY = 86400;
	var STORE_KEY = "lmk:subs:v1";

	function isObject(v) {
		return v !== null && typeof v === "object" && !Array.isArray(v);
	}

	// Normalize and validate an endpoint body.
	function interpret(body) {
		if (!isObject(body)) throw new Error("lmk: response is not an object");
		if (body.happened !== true && body.happened !== false) throw new Error("lmk: missing happened bool");
		var delay = Number(body.delay);
		if (!Number.isFinite(delay) || delay < 0) delay = DEFAULT_DELAY;
		var actions = Array.isArray(body.actions)
			? body.actions
					.filter(isObject)
					.filter(a => typeof a.url === "string")
					.map(a => ({ label: String(a.label || a.url), url: String(a.url) }))
			: [];
		return {
			happened: body.happened,
			when: typeof body.when === "string" ? body.when : null,
			message: typeof body.message === "string" ? body.message : null,
			actions: actions,
			delay: delay
		};
	}

	function nextCheck(now, delaySeconds) {
		return now + delaySeconds * 1000;
	}

	function isDue(sub, now) {
		return !sub.nextCheck || now >= sub.nextCheck;
	}

	// storage
	var memFallback = {};
	function load() {
		try {
			return JSON.parse(g.localStorage.getItem(STORE_KEY)) || {};
		} catch {
			return memFallback;
		}
	}
	function save(subs) {
		memFallback = subs;
		try {
			g.localStorage.setItem(STORE_KEY, JSON.stringify(subs));
		} catch {
			/* private mode */
		}
	}

	// notification
	function notify(url, result) {
		var detail = { url: url, message: result.message, when: result.when, actions: result.actions };
		try {
			g.document.dispatchEvent(new CustomEvent("lmk:fired", { detail: detail }));
		} catch {
			/* node / no DOM */
		}
		try {
			if (g.Notification && g.Notification.permission === "granted") {
				new g.Notification(result.message || "Let me know: it happened", {
					body: url
				});
			}
		} catch {
			/* never break polling on notify failure */
		}
	}

	function fetcher() {
		if (typeof g.fetch === "function") return g.fetch.bind(g);
		throw new Error("lmk: no fetch available");
	}

	// Check one URL, returns the normalized result. Fires then deletes when happened.
	async function check(url, fetchImpl) {
		var res = await (fetchImpl || fetcher())(url, { headers: { Accept: "application/json" } });
		var result;
		if (res.status === 204) {
			result = { happened: false, when: null, message: null, actions: [], delay: DEFAULT_DELAY };
		} else {
			result = interpret(await res.json());
		}
		var subs = load();
		if (result.happened) {
			delete subs[url];
			save(subs);
			notify(url, result);
		} else if (subs[url]) {
			const n = Date.now();
			subs[url].lastCheck = n;
			subs[url].nextCheck = nextCheck(n, result.delay);
			save(subs);
		}
		return result;
	}

	// Subscribe
	async function subscribe(url, fetchImpl) {
		var result = await check(url, fetchImpl);
		if (!result.happened) {
			const subs = load();
			const now = Date.now();
			subs[url] = { added: now, lastCheck: now, nextCheck: nextCheck(now, result.delay) };
			save(subs);
		}
		return result;
	}

	function unsubscribe(url) {
		var subs = load();
		delete subs[url];
		save(subs);
	}

	function list() {
		return load();
	}

	async function checkAllDue(fetchImpl) {
		var now = Date.now();
		var out = [];
		var subs = load();
		for (var url of Object.keys(subs)) {
			if (isDue(subs[url], now)) out.push({ url: url, result: await check(url, fetchImpl) });
		}
		return out;
	}

	// Auto-wire every [data-lmk-endpoint] block
	function mount(root) {
		var scope = root || (g.document ? g.document : null);
		if (!scope || !scope.querySelectorAll) return;
		scope.querySelectorAll("[data-lmk-endpoint]").forEach(el => {
			if (el.dataset.lmkMounted) return;
			el.dataset.lmkMounted = "1";
			render(el);
		});
	}

	function render(el) {
		var url = el.dataset.lmkEndpoint;
		var subs = load();
		if (subs[url]) {
			el.innerHTML = "";
			const wrap = g.document.createElement("span");
			wrap.textContent = el.dataset.lmkWatching || "Watching, you'll be flagged here when it happens ";
			const btn = g.document.createElement("button");
			btn.type = "button";
			btn.textContent = el.dataset.lmkUnwatch || "Stop watching";
			btn.addEventListener("click", () => {
				unsubscribe(url);
				render(el);
			});
			const now = g.document.createElement("button");
			now.type = "button";
			now.textContent = el.dataset.lmkCheck || "Check now";
			now.addEventListener("click", async () => {
				now.disabled = true;
				try {
					const r = await check(url);
					if (r.happened) renderFired(el, r);
				} catch {
					/* keep state on failure */
				}
				now.disabled = false;
			});
			wrap.appendChild(now);
			wrap.appendChild(g.document.createTextNode(" "));
			wrap.appendChild(btn);
			el.appendChild(wrap);
			return;
		}
		check(url)
			.then(r => {
				if (r.happened) renderFired(el, r);
				else {
					el.innerHTML = "";
					const sub = g.document.createElement("button");
					sub.type = "button";
					sub.textContent = el.dataset.lmkNotify || "Let me know when this happens";
					sub.addEventListener("click", async () => {
						try {
							if (g.Notification && g.Notification.permission === "default") await g.Notification.requestPermission();
						} catch {
							/* optional */
						}
						try {
							const r2 = await subscribe(url);
							if (r2.happened) renderFired(el, r2);
							else render(el);
						} catch {
							/* keep button on failure */
						}
					});
					el.appendChild(sub);
				}
			})
			.catch(() => {
				/* endpoint unreachable: leave placeholder text */
			});
	}

	function renderFired(el, r) {
		el.innerHTML = "";
		var msg = g.document.createElement("strong");
		msg.textContent = r.message || el.dataset.lmkFired || "It's happened";
		el.appendChild(msg);
		r.actions.forEach(a => {
			el.appendChild(g.document.createTextNode(" "));
			var link = g.document.createElement("a");
			link.href = a.url;
			link.textContent = a.label;
			el.appendChild(link);
		});
	}

	var LMK = {
		VERSION: VERSION,
		DEFAULT_DELAY: DEFAULT_DELAY,
		interpret: interpret,
		nextCheck: nextCheck,
		isDue: isDue,
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		list: list,
		check: check,
		checkAllDue: checkAllDue,
		mount: mount
	};

	g.LMK = LMK;
	if (typeof module !== "undefined" && module.exports) module.exports = LMK;
})(typeof globalThis !== "undefined" ? globalThis : this);
