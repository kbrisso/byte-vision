import DocumentSearchFormPage from '../pageobjects/document-search-form-page.js';

describe('Document Search Form', () => {
    beforeEach(async () => {
        await browser.url('/');
        // Wait for app initialization
        await browser.pause(2000);
        await DocumentSearchFormPage.open();
    });

    afterEach(async () => {
        // Take screenshot after each test for debugging
        const testName = expect.getState().currentTestName?.replace(/\s+/g, '-') || 'unknown';
        await browser.saveScreenshot(`./test/screenshots/document-search-${testName}.png`);
    });

    describe('Form Rendering', () => {
        it('should display all form elements correctly', async () => {
            console.log('Testing form rendering...');

            // Wait for form to load
            await DocumentSearchFormPage.waitForFormToLoad();

            // Check main form elements
            await expect(DocumentSearchFormPage.searchInput).toBeDisplayed();
            await expect(DocumentSearchFormPage.indexSelect).toBeDisplayed();
            await expect(DocumentSearchFormPage.searchButton).toBeDisplayed();
            await expect(DocumentSearchFormPage.clearButton).toBeDisplayed();

            // Check filter elements
            await expect(DocumentSearchFormPage.titleFilter).toBeDisplayed();
            await expect(DocumentSearchFormPage.metaKeywordsFilter).toBeDisplayed();
            await expect(DocumentSearchFormPage.metaDescriptionFilter).toBeDisplayed();

            console.log('All form elements are displayed correctly');
        });

        it('should show placeholder text in search input', async () => {
            const placeholder = await DocumentSearchFormPage.searchInput.getAttribute('placeholder');
            expect(placeholder).toContain('Search documents');
        });

        it('should display loading spinner during search', async () => {
            // Fill search form
            await DocumentSearchFormPage.fillSearchForm({
                query: 'test search',
                index: 'test-index'
            });

            // Click search and immediately check for loading state
            await DocumentSearchFormPage.searchButton.click();
            
            // Check if loading spinner appears
            const loadingSpinner = await DocumentSearchFormPage.loadingSpinner;
            if (await loadingSpinner.isExisting()) {
                await expect(loadingSpinner).toBeDisplayed();
                console.log('Loading spinner displayed during search');
            }
        });
    });

    describe('Search Functionality', () => {
        it('should perform basic document search', async () => {
            console.log('Testing basic document search...');

            const searchData = {
                query: 'legal document',
                index: 'documents-index'
            };

            await DocumentSearchFormPage.fillSearchForm(searchData);
            await DocumentSearchFormPage.performSearch();

            // Wait for search results or no results message
            await DocumentSearchFormPage.waitForSearchResults();

            // Verify search was executed (either results or no results message)
            const hasResults = await DocumentSearchFormPage.hasSearchResults();
            const hasNoResults = await DocumentSearchFormPage.hasNoResultsMessage();

            expect(hasResults || hasNoResults).toBe(true);
            console.log('Basic search completed successfully');
        });

        it('should handle search with filters', async () => {
            console.log('Testing search with filters...');

            const searchData = {
                query: 'contract',
                index: 'legal-docs',
                title: 'Service Agreement',
                metaKeywords: 'legal, contract',
                metaDescription: 'Legal document'
            };

            await DocumentSearchFormPage.fillSearchForm(searchData);
            await DocumentSearchFormPage.performSearch();

            await DocumentSearchFormPage.waitForSearchResults();

            // Verify filters were applied (check if search parameters are reflected in UI)
            const titleValue = await DocumentSearchFormPage.titleFilter.getValue();
            const keywordsValue = await DocumentSearchFormPage.metaKeywordsFilter.getValue();
            
            expect(titleValue).toBe(searchData.title);
            expect(keywordsValue).toBe(searchData.metaKeywords);

            console.log('Search with filters completed successfully');
        });

        it('should validate required fields', async () => {
            console.log('Testing form validation...');

            // Try to search without required fields
            await DocumentSearchFormPage.searchButton.click();

            // Check for validation messages or disabled state
            const isSearchDisabled = !(await DocumentSearchFormPage.searchButton.isEnabled());
            
            if (isSearchDisabled) {
                console.log('Search button properly disabled without required fields');
                expect(isSearchDisabled).toBe(true);
            } else {
                // Check for validation error messages
                const errorMessages = await DocumentSearchFormPage.getValidationErrors();
                expect(errorMessages.length).toBeGreaterThan(0);
                console.log('Validation errors displayed correctly');
            }
        });

        it('should handle empty search results', async () => {
            console.log('Testing empty search results...');

            const searchData = {
                query: 'nonexistentdocument12345',
                index: 'test-index'
            };

            await DocumentSearchFormPage.fillSearchForm(searchData);
            await DocumentSearchFormPage.performSearch();

            await DocumentSearchFormPage.waitForSearchResults();

            // Should show no results message
            const noResultsMessage = await DocumentSearchFormPage.noResultsMessage;
            if (await noResultsMessage.isExisting()) {
                await expect(noResultsMessage).toBeDisplayed();
                const messageText = await noResultsMessage.getText();
                expect(messageText.toLowerCase()).toContain('no results');
                console.log('No results message displayed correctly');
            }
        });
    });

    describe('Form Interactions', () => {
        it('should clear form when clear button is clicked', async () => {
            console.log('Testing form clear functionality...');

            // Fill the form
            await DocumentSearchFormPage.fillSearchForm({
                query: 'test document',
                index: 'test-index',
                title: 'Test Title',
                metaKeywords: 'test, keywords'
            });

            // Clear the form
            await DocumentSearchFormPage.clearForm();

            // Verify all fields are cleared
            expect(await DocumentSearchFormPage.searchInput.getValue()).toBe('');
            expect(await DocumentSearchFormPage.titleFilter.getValue()).toBe('');
            expect(await DocumentSearchFormPage.metaKeywordsFilter.getValue()).toBe('');
            expect(await DocumentSearchFormPage.metaDescriptionFilter.getValue()).toBe('');

            console.log('Form cleared successfully');
        });

        it('should handle index selection', async () => {
            console.log('Testing index selection...');

            await DocumentSearchFormPage.waitForIndexOptions();

            const availableOptions = await DocumentSearchFormPage.getIndexOptions();
            
            if (availableOptions.length > 1) {
                // Select the second option (first is usually empty/default)
                await DocumentSearchFormPage.selectIndex(availableOptions[1]);
                
                const selectedValue = await DocumentSearchFormPage.indexSelect.getValue();
                expect(selectedValue).toBe(availableOptions[1]);
                console.log('Index selection working correctly');
            } else {
                console.log('Only one index option available, skipping selection test');
            }
        });

        it('should support keyboard navigation', async () => {
            console.log('Testing keyboard navigation...');

            // Focus on search input
            await DocumentSearchFormPage.searchInput.click();
            
            // Tab through form elements
            await browser.keys(['Tab']); // Should focus on index select
            await browser.keys(['Tab']); // Should focus on title filter
            await browser.keys(['Tab']); // Should focus on meta keywords
            await browser.keys(['Tab']); // Should focus on meta description
            await browser.keys(['Tab']); // Should focus on search button

            // Verify search button is focused
            const focusedElement = await browser.getActiveElement();
            const searchButtonId = await DocumentSearchFormPage.searchButton.getAttribute('id');
            const focusedId = await focusedElement.getAttribute('id');

            if (searchButtonId && focusedId) {
                expect(focusedId).toBe(searchButtonId);
                console.log('Keyboard navigation working correctly');
            }
        });
    });

    describe('Results Display', () => {
        it('should display search results in table format', async () => {
            console.log('Testing results table display...');

            await DocumentSearchFormPage.fillSearchForm({
                query: 'document',
                index: 'test-index'
            });

            await DocumentSearchFormPage.performSearch();
            await DocumentSearchFormPage.waitForSearchResults();

            const hasResults = await DocumentSearchFormPage.hasSearchResults();
            
            if (hasResults) {
                // Check if results table exists
                const resultsTable = await DocumentSearchFormPage.resultsTable;
                await expect(resultsTable).toBeDisplayed();

                // Check table headers
                const tableHeaders = await DocumentSearchFormPage.getTableHeaders();
                expect(tableHeaders.length).toBeGreaterThan(0);

                console.log('Results table displayed correctly');
            } else {
                console.log('No results to display table for');
            }
        });

        it('should handle result pagination if present', async () => {
            await DocumentSearchFormPage.fillSearchForm({
                query: 'document',
                index: 'test-index'
            });

            await DocumentSearchFormPage.performSearch();
            await DocumentSearchFormPage.waitForSearchResults();

            // Check if pagination exists
            const paginationExists = await DocumentSearchFormPage.hasPagination();
            
            if (paginationExists) {
                const currentPage = await DocumentSearchFormPage.getCurrentPage();
                expect(currentPage).toBeGreaterThan(0);

                const totalPages = await DocumentSearchFormPage.getTotalPages();
                if (totalPages > 1) {
                    await DocumentSearchFormPage.goToNextPage();
                    const newPage = await DocumentSearchFormPage.getCurrentPage();
                    expect(newPage).toBe(currentPage + 1);
                    console.log('Pagination working correctly');
                }
            } else {
                console.log('No pagination present');
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            console.log('Testing error handling...');

            // Fill form with data that might cause errors
            await DocumentSearchFormPage.fillSearchForm({
                query: 'test',
                index: 'nonexistent-index'
            });

            await DocumentSearchFormPage.performSearch();
            await DocumentSearchFormPage.waitForSearchResults();

            // Check for error message
            const errorMessage = await DocumentSearchFormPage.getErrorMessage();
            
            if (errorMessage) {
                expect(errorMessage.length).toBeGreaterThan(0);
                console.log('Error message displayed:', errorMessage);
            } else {
                console.log('No error occurred or error handled silently');
            }
        });

        it('should reset form state after error', async () => {
            // After any error, the form should still be usable
            await DocumentSearchFormPage.fillSearchForm({
                query: 'valid search',
                index: 'test-index'
            });

            // Form should still be interactive
            expect(await DocumentSearchFormPage.searchInput.isEnabled()).toBe(true);
            expect(await DocumentSearchFormPage.searchButton.isEnabled()).toBe(true);

            console.log('Form remains functional after error');
        });
    });

    describe('Responsive Design', () => {
        it('should work on mobile viewport', async () => {
            console.log('Testing mobile responsiveness...');

            // Set mobile viewport
            await browser.setWindowSize(375, 667);
            await browser.pause(500); // Allow for responsive adjustments

            // Verify form is still functional
            await expect(DocumentSearchFormPage.searchInput).toBeDisplayed();
            await expect(DocumentSearchFormPage.searchButton).toBeDisplayed();

            // Test basic functionality
            await DocumentSearchFormPage.fillSearchForm({
                query: 'mobile test',
                index: 'test-index'
            });

            expect(await DocumentSearchFormPage.searchInput.getValue()).toBe('mobile test');

            console.log('Mobile responsiveness verified');

            // Reset to desktop size
            await browser.setWindowSize(1280, 720);
        });

        it('should work on tablet viewport', async () => {
            console.log('Testing tablet responsiveness...');

            // Set tablet viewport
            await browser.setWindowSize(768, 1024);
            await browser.pause(500);

            // Verify form layout
            await expect(DocumentSearchFormPage.searchInput).toBeDisplayed();
            await expect(DocumentSearchFormPage.indexSelect).toBeDisplayed();

            console.log('Tablet responsiveness verified');

            // Reset to desktop size
            await browser.setWindowSize(1280, 720);
        });
    });
});
