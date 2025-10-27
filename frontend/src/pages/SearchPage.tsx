import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { searchWeb } from '@/services/searchApi';
import { saveSearchToHistory } from '@/services/historyApi';
import type { SearchFilters } from '@/types/search';

export const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [filters] = useState<SearchFilters>({
        contentType: 'all',
        sortBy: 'relevance'
    });

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
        queryKey: ['search', activeQuery, filters],
        queryFn: ({ pageParam = 1 }) =>
            searchWeb({
                query: activeQuery,
                filters,
                page: pageParam,
                limit: 10
            }),
        enabled: Boolean(activeQuery),
        initialPageParam: 1,
        getNextPageParam: lastPage => {
            return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
    });

    const handleSearch = async (query: string) => {
        setActiveQuery(query);
        setSearchQuery(query);

        // Save to history
        try {
            await saveSearchToHistory(query, 0);
        } catch (error) {
            console.warn('Failed to save search to history:', error);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSearch(suggestion);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    // Flatten paginated results
    const searchResults = data?.pages[0]
        ? {
              ...data.pages[0],
              results: data.pages.flatMap(page => page.results),
              totalCount: data.pages[0].totalCount
          }
        : undefined;

    return (
        <div className='min-h-screen bg-background'>
            <div className='max-w-6xl mx-auto px-4 py-8'>
                {/* Search Header */}
                <div className='mb-8'>
                    <div className='text-center mb-8'>
                        <h1 className='text-3xl font-bold text-foreground mb-2'>Web Search Agent</h1>
                        <p className='text-muted-foreground'>Search the web with AI-powered intelligence</p>
                    </div>

                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={handleSearch}
                        isLoading={isLoading}
                    />
                </div>

                {/* Search Results */}
                <div className='mb-8'>
                    <SearchResults
                        data={searchResults}
                        isLoading={isLoading}
                        isError={isError}
                        error={error as Error}
                        query={activeQuery}
                        onLoadMore={handleLoadMore}
                        onSuggestionClick={handleSuggestionClick}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                    />
                </div>
            </div>
        </div>
    );
};
