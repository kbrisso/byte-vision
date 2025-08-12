import Page from './base.page.js';

class DocumentSearchFormPage extends Page {
    // Form elements
    get searchInput() {
        return $('[data-testid="document-search-input"], input[placeholder*="Search"], #search-input');
    }

    get indexSelect() {
        return $('[data-testid="index-select"], select[name="index"], #index-select');
    }

    get searchButton() {
        return $('[data-testid="search-button"], button*=Search, .search-btn');
    }

    get clearButton() {
        return $('[data-testid="clear-button"], button*=Clear, .clear-btn');
    }

    // Filter elements
    get titleFilter() {
        return $('[data-testid="title-filter"], input[name="title"], #title-filter');
    }

    get metaKeywordsFilter() {
        return $('[data-testid="meta-keywords-filter"], input[name="metaKeywords"], #meta-keywords');
    }

    get metaDescriptionFilter() {
        return $('[data-testid="meta-description-filter"], input[name="metaDescription"], #meta-description');
    }

    // Results elements
    get resultsContainer() {
        return $('[data-testid="search-results"], .search-results, .results-container');
    }

    get resultsTable() {
        return $('[data-testid="results-table"], .results-table, table');
    }

    get noResultsMessage() {
        return $('[data-testid="no-results"], .no-results, .empty-results');
    }

    get loadingSpinner() {
        return $('[data-testid="loading-spinner"], .spinner, .loading');
    }

    get errorMessage() {
        return $('[data-testid="error-message"], .error-message, .alert-danger');
    }

    // Pagination elements
    get pagination() {
        return $('[data-testid="pagination"], .pagination');
    }

    get nextPageButton() {
        return $('[data-testid="next-page"], .pagination .next, button*=Next');
    }

    get prevPageButton() {
        return $('[data-testid="prev-page"], .pagination .prev, button*=Previous');
    }

    get currentPageIndicator() {
        return $('[data-testid="current-page"], .pagination .current, .page-current');
    }

    /**
     * Navigate to the document search page
     */
    async open() {
        await super.open('/');
        await this.waitForFormToLoad();
        console.log('Document Search Form page opened');
    }

    /**
     * Wait for the form to be fully loaded
     */
    async waitForFormToLoad() {
        try {
            await this.searchInput.waitForDisplayed({ timeout: 10000 });
            await this.indexSelect.waitForDisplayed({ timeout: 5000 });
            console.log('Document search form loaded successfully');
        } catch (error) {
            console.error('Form loading timeout:', error.message);
            await this.debugPageState();
            throw error;
        }
    }

    /**
     * Fill the search form with provided data
     */
    async fillSearchForm(data) {
        console.log('Filling search form with data:', data);

        if (data.query) {
            await this.searchInput.waitForDisplayed();
            await this.searchInput.setValue(data.query);
        }

        if (data.index) {
            await this.selectIndex(data.index);
        }

        if (data.title) {
            await this.titleFilter.setValue(data.title);
        }

        if (data.metaKeywords) {
            await this.metaKeywordsFilter.setValue(data.metaKeywords);
        }

        if (data.metaDescription) {
            await this.metaDescriptionFilter.setValue(data.metaDescription);
        }

        console.log('Search form filled successfully');
    }

    /**
     * Perform search action
     */
    async performSearch() {
        console.log('Performing search...');
        await this.searchButton.waitForClickable();
        await this.searchButton.click();
        console.log('Search button clicked');
    }

    /**
     * Clear the search form
     */
    async clearForm() {
        console.log('Clearing search form...');
        await this.clearButton.waitForClickable();
        await this.clearButton.click();
        
        // Wait a moment for form to clear
        await browser.pause(500);
        console.log('Search form cleared');
    }

    /**
     * Select an index from the dropdown
     */
    async selectIndex(indexValue) {
        console.log(`Selecting index: ${indexValue}`);
        await this.indexSelect.waitForDisplayed();
        await this.indexSelect.selectByVisibleText(indexValue);
    }

    /**
     * Get available index options
     */
    async getIndexOptions() {
        await this.indexSelect.waitForDisplayed();
        const options = await this.indexSelect.$$('option');
        const optionTexts = [];
        
        for (const option of options) {
            const text = await option.getText();
            if (text.trim()) { // Skip empty options
                optionTexts.push(text);
            }
        }
        
        console.log('Available index options:', optionTexts);
        return optionTexts;
    }

    /**
     * Wait for index options to load
     */
    async waitForIndexOptions() {
        await this.indexSelect.waitForDisplayed();
        // Wait for options to populate
        await browser.waitUntil(async () => {
            const options = await this.indexSelect.$$('option');
            return options.length > 1; // More than just empty option
        }, {
            timeout: 5000,
            timeoutMsg: 'Index options did not load'
        });
    }

    /**
     * Wait for search results to appear
     */
    async waitForSearchResults() {
        console.log('Waiting for search results...');
        
        try {
            // Wait for either results or no results message
            await browser.waitUntil(async () => {
                const hasResults = await this.hasSearchResults();
                const hasNoResults = await this.hasNoResultsMessage();
                const hasError = await this.hasErrorMessage();
                
                return hasResults || hasNoResults || hasError;
            }, {
                timeout: 10000,
                timeoutMsg: 'Search results did not appear'
            });
            
            console.log('Search results loaded');
        } catch (error) {
            console.error('Timeout waiting for search results:', error.message);
            await this.debugPageState();
            throw error;
        }
    }

    /**
     * Check if search results exist
     */
    async hasSearchResults() {
        try {
            const resultsContainer = await this.resultsContainer;
            if (await resultsContainer.isExisting()) {
                const resultsTable = await this.resultsTable;
                if (await resultsTable.isExisting()) {
                    const rows = await resultsTable.$$('tbody tr, .result-row');
                    return rows.length > 0;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if no results message is displayed
     */
    async hasNoResultsMessage() {
        try {
            const noResultsMsg = await this.noResultsMessage;
            return await noResultsMsg.isExisting() && await noResultsMsg.isDisplayed();
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if error message is displayed
     */
    async hasErrorMessage() {
        try {
            const errorMsg = await this.errorMessage;
            return await errorMsg.isExisting() && await errorMsg.isDisplayed();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get error message text
     */
    async getErrorMessage() {
        try {
            if (await this.hasErrorMessage()) {
                return await this.errorMessage.getText();
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get validation errors
     */
    async getValidationErrors() {
        const errorElements = await $$('.validation-error, .error-text, .invalid-feedback');
        const errors = [];
        
        for (const element of errorElements) {
            if (await element.isDisplayed()) {
                errors.push(await element.getText());
            }
        }
        
        return errors;
    }

    /**
     * Get table headers
     */
    async getTableHeaders() {
        const table = await this.resultsTable;
        if (await table.isExisting()) {
            const headers = await table.$$('thead th, .table-header');
            const headerTexts = [];
            
            for (const header of headers) {
                headerTexts.push(await header.getText());
            }
            
            return headerTexts;
        }
        return [];
    }

    /**
     * Check if pagination exists
     */
    async hasPagination() {
        try {
            const pagination = await this.pagination;
            return await pagination.isExisting() && await pagination.isDisplayed();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current page number
     */
    async getCurrentPage() {
        if (await this.hasPagination()) {
            const currentPage = await this.currentPageIndicator;
            if (await currentPage.isExisting()) {
                const pageText = await currentPage.getText();
                return parseInt(pageText) || 1;
            }
        }
        return 1;
    }

    /**
     * Get total pages
     */
    async getTotalPages() {
        if (await this.hasPagination()) {
            const pageInfo = await this.pagination.$('.page-info, .pagination-info');
            if (await pageInfo.isExisting()) {
                const infoText = await pageInfo.getText();
                const match = infoText.match(/of (\d+)/);
                return match ? parseInt(match[1]) : 1;
            }
        }
        return 1;
    }

    /**
     * Go to next page
     */
    async goToNextPage() {
        if (await this.hasPagination()) {
            const nextButton = await this.nextPageButton;
            if (await nextButton.isExisting() && await nextButton.isEnabled()) {
                await nextButton.click();
                await browser.pause(1000); // Wait for page load
            }
        }
    }

    /**
     * Debug current page state
     */
    async debugPageState() {
        console.log('=== DEBUG: Current Page State ===');
        
        try {
            const url = await browser.getUrl();
            console.log('Current URL:', url);

            const title = await browser.getTitle();
            console.log('Page title:', title);

            // Check if main elements exist
            const searchInputExists = await this.searchInput.isExisting();
            console.log('Search input exists:', searchInputExists);

            const indexSelectExists = await this.indexSelect.isExisting();
            console.log('Index select exists:', indexSelectExists);

            const searchButtonExists = await this.searchButton.isExisting();
            console.log('Search button exists:', searchButtonExists);

            // Check for any error messages on page
            const errorElements = await $$('.error, .alert-danger, [class*="error"]');
            if (errorElements.length > 0) {
                console.log('Found error elements:');
                for (let i = 0; i < errorElements.length; i++) {
                    const errorText = await errorElements[i].getText();
                    if (errorText) {
                        console.log(`  Error ${i + 1}: ${errorText}`);
                    }
                }
            }

            // Log any console errors
            const logs = await browser.getLogs('browser');
            const errors = logs.filter(log => log.level === 'SEVERE');
            if (errors.length > 0) {
                console.log('Browser console errors:');
                errors.forEach((error, index) => {
                    console.log(`  Console Error ${index + 1}: ${error.message}`);
                });
            }

        } catch (debugError) {
            console.error('Error during debug:', debugError.message);
        }

        console.log('=== END DEBUG ===');
    }
}

export default new DocumentSearchFormPage();
