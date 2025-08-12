import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const vfileMinPathBrowser = resolve(__dirname, "node_modules/vfile/lib/minpath.browser.js");
const vfileMinProcBrowser = resolve(__dirname, "node_modules/vfile/lib/minproc.browser.js");
const vfileMinURLBrowser = resolve(__dirname, "node_modules/vfile/lib/minurl.browser.js");

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            "#minpath": vfileMinPathBrowser,
            "#minproc": vfileMinProcBrowser,
            "#minurl": vfileMinURLBrowser,
        },
        conditions: ["browser", "import", "module", "default"],
    },

    optimizeDeps: {
        include: ["vfile"]
    },

    build: {
        commonjsOptions: {
            include: [/node_modules/],
        },
        target: 'es2015',
        minify: 'esbuild',
        sourcemap: false,
        chunkSizeWarningLimit: 1000
    }
});