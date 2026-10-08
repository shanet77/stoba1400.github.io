import config, { monolocale } from "$config";

export function getRelativeLocaleUrl(locale: string, path?: string): string {
	const defaultLocale = config.i18n.defaultLocale;
	const normalizedPath = !path ? "/" : path.startsWith("/") ? path : `/${path}`;

	if (locale === defaultLocale) return normalizedPath;
	if (normalizedPath === "/") return `/${locale}`;

	return `/${locale}${normalizedPath}`;
}

export function slugOf(id: string): string {
	return monolocale ? id : id.split("/").slice(1).join("/");
}

export function localeOf(id: string): string {
	return monolocale ? config.i18n.defaultLocale : id.split("/")[0];
}

export function isLiveEntry(entry: { id: string; data: Record<string, unknown> }, locale: string): boolean {
	if (entry.data.draft === true) return false;
	return monolocale || entry.id.split("/")[0] === locale;
}

export function entryUrl(locale: string, section: string, id: string): string {
	return getRelativeLocaleUrl(locale, `/${section}/${slugOf(id)}`);
}

export function localePaths(): { params: { locale: string | undefined } }[] {
	return config.i18n.locales.map(locale => ({ params: { locale: config.i18n.defaultLocale === locale ? undefined : locale } }));
}

export function entryParams(id: string): { locale: string | undefined; id: string } {
	if (monolocale) return { locale: undefined, id };
	const [language, ...ids] = id.split("/");
	return {
		locale: config.i18n.defaultLocale === language ? undefined : language,
		id: ids.join("/")
	};
}

export default getRelativeLocaleUrl;
