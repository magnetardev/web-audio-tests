import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://gh.magnetar.dev",
	base: "/web-audio-tests",
	// outDir: "web-audio-tests",
	vite: {
		build: {
			assetsInlineLimit: 0,
		}
	},
});
