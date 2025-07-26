export default class BasePage {
    /**
     * Wait for page to load with a specific element
     * @param {string} selector - CSS selector to wait for
     */
    async waitForPageLoad(selector = 'body') {
        await browser.waitUntil(
            async () => {
                const readyState = await browser.execute(() => document.readyState);
                return readyState === 'complete';
            },
            {
                timeout: 15000,
                timeoutMsg: 'Page did not finish loading'
            }
        );

        // Wait for React to render if selector provided
        if (selector !== 'body') {
            await browser.waitUntil(
                async () => {
                    try {
                        const element = await $(selector);
                        return await element.isDisplayed();
                    } catch (error) {
                        return false;
                    }
                },
                {
                    timeout: 10000,
                    timeoutMsg: `Element ${selector} not found after page load`
                }
            );
        }
    }

    /**
     * Wait for loading to complete (generic method)
     */
    async waitForLoadingToComplete() {
        // Wait for common loading indicators to disappear
        await browser.waitUntil(
            async () => {
                const loadingSelectors = [
                    '.spinner-border',
                    '.theme-loading-spinner',
                    '[class*="loading"]',
                    '[class*="spinner"]'
                ];

                for (const selector of loadingSelectors) {
                    try {
                        const elements = await $$(selector);
                        for (const element of elements) {
                            if (await element.isDisplayed()) {
                                return false;
                            }
                        }
                    } catch (error) {
                        // Continue checking other selectors
                    }
                }
                return true;
            },
            {
                timeout: 10000,
                timeoutMsg: 'Loading indicators did not disappear'
            }
        );
    }
}