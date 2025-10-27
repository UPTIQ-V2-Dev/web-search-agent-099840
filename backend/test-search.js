// Quick test to verify the search module implementation
import { searchService } from './src/services/index.ts';

async function testSearch() {
    console.log('Testing search service...');

    try {
        // Test search suggestions
        const suggestions = await searchService.getSearchSuggestions('web');
        console.log('✅ Search suggestions:', suggestions);

        // Test mock web search
        const searchResults = await searchService.performWebSearchWithCache(1, 'test query', {
            page: 1,
            limit: 10
        });
        console.log('✅ Mock search results structure:', {
            totalCount: searchResults.totalCount,
            resultsLength: searchResults.results.length,
            hasNextPage: searchResults.hasNextPage
        });

        console.log('🎉 All search service tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testSearch();
