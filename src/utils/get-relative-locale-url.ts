import config from "$config";

/**
 * Client-safe replacement for `astro:i18n` URL generation.
 * Mirrors this site's routing config (`prefixDefaultLocale: false`).
 */
export function getRelativeLocaleUrl(locale: string, path?: string): string {
	const defaultLocale = config.i18n.defaultLocale;
	const normalizedPath = !path ? "/" : path.startsWith("/") ? path : `/${path}`;

	if (locale === defaultLocale) return normalizedPath;
	if (normalizedPath === "/") return `/${locale}`;

	return `/${locale}${normalizedPath}`;
}

export default getRelativeLocaleUrl;
