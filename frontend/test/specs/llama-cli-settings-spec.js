import LlamaCliSettingsPage from '../pageobjects/llama-cli-settings-page.js';

describe('Llama CLI Settings Form', () => {
    beforeEach(async () => {
        await browser.url('/');
        // Wait a bit for the app to initialize
        await browser.pause(2000);
    });

    it('should load the page and display save button', async () => {
        console.log('Starting test: page load and save button check');

        try {
            // Navigate and wait for page load
            await LlamaCliSettingsPage.open();
            console.log('Page opened successfully');

            // Debug the current page state
            await LlamaCliSettingsPage.debugPageState();

            // Try to find the save button with extended timeout
            console.log('Looking for save button...');

            const saveButton = await LlamaCliSettingsPage.getSaveButton();
            expect(saveButton).toBeDefined();

            const isDisplayed = await saveButton.isDisplayed();
            expect(isDisplayed).toBe(true);

            console.log('Save button found and displayed');

            // Take a final screenshot
            await browser.saveScreenshot('./test/screenshots/test-completed.png');

        } catch (error) {
            console.error('Test failed:', error.message);

            // Take error screenshot
            await browser.saveScreenshot('./test/screenshots/test-error.png');

            // Debug page state on error
            await LlamaCliSettingsPage.debugPageState();

            throw error;
        }
    });

    it('should be able to interact with form elements', async () => {
        await LlamaCliSettingsPage.open();

        // Wait for loading to complete
        await LlamaCliSettingsPage.waitForLoadingToComplete();

        // Check if we can find any input elements
        const inputs = await $$('input');
        console.log(`Found ${inputs.length} input elements`);

        // Check if we can find any select elements
        const selects = await $$('select');
        console.log(`Found ${selects.length} select elements`);

        // Basic assertion that some form elements exist
        expect(inputs.length + selects.length).toBeGreaterThan(0);
    });
});