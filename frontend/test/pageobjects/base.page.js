export default class Page {
    /**
     * Opens a sub page of the page
     * @param {string} path path to append (e.g. "/documents/search")
     */
    async open(path = "/") {
        // Robust base URL resolution:
        // 1) WDIO baseUrl if available
        // 2) Env variable overrides
        // 3) Sensible default for local dev
        const wdioBase =
            (globalThis.browser && globalThis.browser.config && globalThis.browser.config.baseUrl) ||
            process.env.WDIO_BASE_URL ||
            process.env.BASE_URL ||
            "http://localhost:5173";

        // Normalize base and path to avoid double slashes
        const normalize = (s) => (typeof s === "string" ? s : "");
        const base = normalize(wdioBase).replace(/\/+$/, "");
        const suffix = normalize(path).startsWith("/") ? normalize(path) : `/${normalize(path)}`;
        const fullUrl = `${base}${suffix}`;

        console.log(`Opening page: ${fullUrl}`);
        await browser.url(fullUrl);

        // Wait for page to load
        await browser.waitUntil(
            async () => (await browser.execute(() => document.readyState)) === "complete",
            { timeout: 10000, timeoutMsg: "Page did not finish loading" },
        );
    }

    async waitForDisplayed(selector, timeout = 5000) {
        await $(selector).waitForDisplayed({ timeout });
    }

    async waitForClickable(selector, timeout = 5000) {
        await $(selector).waitForClickable({ timeout });
    }

    async safeClick(selector) {
        await this.waitForClickable(selector);
        await $(selector).click();
    }

    async safeSetValue(selector, value) {
        await this.waitForDisplayed(selector);
        await $(selector).setValue(value);
    }

    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${name}-${timestamp}.png`;
        await browser.saveScreenshot(`./test/screenshots/${filename}`);
        console.log(`Screenshot saved: ${filename}`);
    }
}