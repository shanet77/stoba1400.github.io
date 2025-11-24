import siteConfig from "./src/utils/config";

const config = siteConfig({
	title: "Shane Tobar",
	prologue: "Welcome to my site",
	author: {
		name: "Shane Tobar",
		email: "stob419@gmail.com",
		link: "https://www.shanetobar.com"
	},
	description: "My personal site",
	copyright: {
		type: "CC BY-NC-ND 4.0",
		year: "2025"
	},
	i18n: {
		locales: ["en"],
		defaultLocale: "en"
	},
	feed: {
		section: "*",
		limit: 20
	},
	latest: "*"
});

export const monolocale = Number(config.i18n.locales.length) === 1;

export default config;
