import { fileURLToPath, URL } from 'node:url';

export default function (eleventyConfig) {
    // Passthrough Static Assets
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("images");
    eleventyConfig.addPassthroughCopy("public")

    // Blog Post Collection
    eleventyConfig.addCollection("posts", (collectionApi) => {
        return collectionApi.getFilteredByGlob("blog/*.md").sort((a, b) => b.data.date - a.data.date);
    });

    // Readable Date Filter
    eleventyConfig.addNunjucksFilter("readableDate", (dateObj) => {
        try {
            const date = new Date(dateObj);
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid Date';
        }
    });

    // Year Filter for Footer (defaults to current year)
    eleventyConfig.addNunjucksFilter("year", (dateObj) => {
        let date;
        if (dateObj) {
            try {
                date = new Date(dateObj);
                if (isNaN(date.getTime())) {
                    date = new Date(); // Default to current year
                }
            } catch (error) {
                console.error("Error getting year:", error);
                date = new Date(); // Default to current year on error
            }
        } else {
            date = new Date(); // Default to current year if no argument provided
        }
        return date.getFullYear();
    });

    // Base URL Filter
    eleventyConfig.addNunjucksFilter("url", (path) => {
        const siteData = eleventyConfig.globalData.site;
        if (siteData && siteData.baseUrl) {
            return new URL(path, siteData.baseUrl).pathname;
        }
        return path;
    });

    return {
        dir: {
            input: ".",
            output: "_site",
            includes: "_includes",
            data: "_data"
        },
        templateFormats: ["njk", "md"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk"
    };
};