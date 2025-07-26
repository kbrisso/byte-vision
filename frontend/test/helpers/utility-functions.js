export class TestUtils {
    /**
     * Wait for a specific condition with custom timeout
     * @param {Function} condition - Function that returns boolean
     * @param {number} timeout - Timeout in milliseconds
     * @param {string} message - Error message if timeout
     */
    static async waitForCondition(condition, timeout = 10000, message = 'Condition not met') {
        await browser.waitUntil(condition, { timeout, timeoutMsg: message });
    }

    /**
     * Generate random test data
     */
    static generateRandomConfig() {
        return {
            description: `Test Config ${Date.now()}`,
            ctxSize: Math.floor(Math.random() * 8192) + 1024,
            threads: Math.floor(Math.random() * 16) + 1,
            temperature: (Math.random() * 2).toFixed(1)
        };
    }

    /**
     * Clear all form inputs
     * @param {Array} inputs - Array of input elements
     */
    static async clearAllInputs(inputs) {
        for (const input of inputs) {
            await input.clearValue();
        }
    }

    /**
     * Verify form validation state
     * @param {Object} page - Page object
     */
    static async verifyValidationState(page) {
        const errors = await page.getValidationErrors();
        return {
            hasErrors: errors.length > 0,
            errorCount: errors.length,
            errors: errors
        };
    }
}
