import BasePage from './base.page.js';

class LlamaCliSettingsPage extends BasePage {
    // Updated selectors based on the actual React component structure
    get descriptionInput() { return $('input[placeholder*="description"], input[id*="Description"]'); }
    get savedSettingsSelect() { return $('select'); }
    get modelSelect() { return $('select[id*="model"], select[id*="Model"]'); }
    get ctxSizeInput() { return $('input[id*="CtxSize"], input[id*="ctx"]'); }
    get threadsInput() { return $('input[id*="Threads"], input[id*="threads"]'); }
    get temperatureInput() { return $('input[id*="Temperature"], input[id*="temp"]'); }
    get topKInput() { return $('input[id*="TopK"], input[id*="topk"]'); }
    get topPInput() { return $('input[id*="TopP"], input[id*="topp"]'); }

    // Updated save button selector - it's in the header card with form attribute
    get saveButton() { return $('button[form="cli-settings-form"]'); }
    get saveButtonAlt() { return $('button[type="submit"]'); }
    get saveButtonText() { return $('button*=Save'); }

    // Alert selectors based on React Bootstrap classes
    get successAlert() { return $('.alert-success, .theme-alert-success'); }
    get errorAlert() { return $('.alert-danger, .theme-alert-danger'); }
    get loadingSpinner() { return $('.spinner-border, .theme-loading-spinner'); }

    // Header and section selectors
    get pageHeader() { return $('h5*=Llama CLI Settings'); }
    get headerCard() { return $('.theme-header-card'); }
    get mainCard() { return $('.theme-main-card'); }
    get form() { return $('form[id="cli-settings-form"]'); }

    /**
     * Navigate to LlamaCli Settings page and wait for it to load
     */
    async open() {
        await browser.url('/Settings'); // Navigate to your app root
        // Add navigation steps if needed to reach settings page
        await this.waitForPageLoad();
    }

    /**
     * Wait for the page to fully load
     */
    async waitForPageLoad() {
        // Wait for the main page elements to be present
        await this.pageHeader.waitForDisplayed({ timeout: 15000 });

        // Wait for loading to complete
        await this.waitForLoadingToComplete();

        // Wait for the save button to be present (try multiple selectors)
        await browser.waitUntil(
            async () => {
                const button1 = await this.saveButton.isDisplayed().catch(() => false);
                const button2 = await this.saveButtonAlt.isDisplayed().catch(() => false);
                const button3 = await this.saveButtonText.isDisplayed().catch(() => false);
                return button1 || button2 || button3;
            },
            {
                timeout: 15000,
                timeoutMsg: 'Save button not found after page load'
            }
        );
    }

    /**
     * Wait for loading spinners to disappear
     */
    async waitForLoadingToComplete() {
        try {
            await browser.waitUntil(
                async () => {
                    const spinners = await $$('.spinner-border, .theme-loading-spinner');
                    for (const spinner of spinners) {
                        if (await spinner.isDisplayed()) {
                            return false;
                        }
                    }
                    return true;
                },
                {
                    timeout: 10000,
                    timeoutMsg: 'Loading did not complete in time'
                }
            );
        } catch (error) {
            console.log('Loading check failed, continuing anyway:', error.message);
        }
    }

    /**
     * Get the save button (try multiple approaches)
     */
    async getSaveButton() {
        // Try different selectors to find the save button
        const selectors = [
            'button[form="cli-settings-form"]',
            'button[type="submit"]',
            'button*=Save',
            '.theme-btn-primary',
            'button:contains("Save")',
            'button:contains("Saving")',
            'button:contains("Saved")'
        ];

        for (const selector of selectors) {
            try {
                const button = await $(selector);
                if (await button.isDisplayed()) {
                    return button;
                }
            } catch (error) {
                // Continue to next selector
            }
        }

        throw new Error('Save button not found with any selector');
    }

    /**
     * Fill basic configuration
     * @param {Object} config - Configuration object
     */
    async fillBasicConfig(config) {
        if (config.description) {
            await this.descriptionInput.waitForDisplayed({ timeout: 5000 });
            await this.descriptionInput.setValue(config.description);
        }

        if (config.model) {
            await this.modelSelect.waitForDisplayed({ timeout: 5000 });
            await this.modelSelect.selectByVisibleText(config.model);
        }
    }

    /**
     * Save the configuration
     */
    async saveConfiguration() {
        const saveButton = await this.getSaveButton();
        await saveButton.click();

        // Wait for save operation to complete
        await browser.waitUntil(
            async () => {
                try {
                    const button = await this.getSaveButton();
                    const buttonText = await button.getText();
                    return !buttonText.includes('Saving');
                } catch (error) {
                    return true; // If button not found, assume save completed
                }
            },
            { timeout: 15000, timeoutMsg: 'Save operation did not complete' }
        );
    }

    /**
     * Check if save was successful
     */
    async isSaveSuccessful() {
        try {
            await this.successAlert.waitForDisplayed({ timeout: 5000 });
            return true;
        } catch (e) {
            // Also check button text for success state
            try {
                const saveButton = await this.getSaveButton();
                const buttonText = await saveButton.getText();
                return buttonText.includes('Saved');
            } catch (error) {
                return false;
            }
        }
    }

    /**
     * Debug method to log page state
     */
    async debugPageState() {
        console.log('=== Page Debug Info ===');

        // Check if main elements exist
        const pageTitle = await browser.getTitle();
        console.log('Page title:', pageTitle);

        // Check for form elements
        const forms = await $$('form');
        console.log('Forms found:', forms.length);

        // Check for buttons
        const buttons = await $$('button');
        console.log('Buttons found:', buttons.length);

        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            try {
                const text = await buttons[i].getText();
                const type = await buttons[i].getAttribute('type');
                const form = await buttons[i].getAttribute('form');
                const classes = await buttons[i].getAttribute('class');
                console.log(`Button ${i}:`, { text, type, form, classes });
            } catch (error) {
                console.log(`Button ${i}: Error getting info`);
            }
        }

        // Check for loading states
        const spinners = await $$('.spinner-border, .theme-loading-spinner');
        console.log('Loading spinners found:', spinners.length);

        // Take a screenshot for debugging
        await browser.saveScreenshot('./test/screenshots/debug-page-state.png');
    }
}

export default new LlamaCliSettingsPage();