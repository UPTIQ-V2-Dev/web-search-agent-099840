import { Clock, ArrowRight } from 'lucide-react';
import { ResultCard } from './ResultCard';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SearchResponse, SearchResult } from '@/types/search';

interface SearchResultsProps {
    data?: SearchResponse;
    isLoading: boolean;
    isError: boolean;
    error?: Error;
    query: string;
    onLoadMore?: () => void;
    onViewDetails?: (result: SearchResult) => void;
    onSuggestionClick?: (suggestion: string) => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
}

export const SearchResults = ({
    data,
    isLoading,
    isError,
    error,
    query,
    onLoadMore,
    onViewDetails,
    onSuggestionClick,
    hasNextPage,
    isFetchingNextPage
}: SearchResultsProps) => {
    if (isLoading && !data) {
        return <LoadingState />;
    }

    if (isError) {
        return (
            <div className='text-center py-12'>
                <div className='text-red-600 mb-2'>Search Error</div>
                <div className='text-sm text-muted-foreground'>
                    {error?.message || 'Something went wrong while searching. Please try again.'}
                </div>
            </div>
        );
    }

    if (!data || data.results.length === 0) {
        return (
            <EmptyState
                query={query}
                suggestions={data?.suggestions}
                onSuggestionClick={onSuggestionClick}
            />
        );
    }

    return (
        <div className='space-y-6'>
            {/* Search metadata */}
            <div className='flex items-center justify-between text-sm text-muted-foreground border-b pb-4'>
                <div className='flex items-center gap-4'>
                    <span>
                        About {data.totalCount.toLocaleString()} results
                        {data.searchTime && <span className='ml-1'>({data.searchTime.toFixed(3)} seconds)</span>}
                    </span>
                    {data.currentPage > 1 && (
                        <Badge
                            variant='outline'
                            className='text-xs'
                        >
                            Page {data.currentPage} of {data.totalPages}
                        </Badge>
                    )}
                </div>
                {query && (
                    <div className='flex items-center gap-1 text-xs'>
                        <Clock className='h-3 w-3' />
                        <span>Search: "{query}"</span>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className='space-y-4'>
                {data.results.map(result => (
                    <ResultCard
                        key={result.id}
                        result={result}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>

            {/* Load more */}
            {hasNextPage && (
                <div className='flex justify-center pt-6'>
                    <Button
                        variant='outline'
                        onClick={onLoadMore}
                        disabled={isFetchingNextPage}
                        className='flex items-center gap-2'
                    >
                        {isFetchingNextPage ? (
                            <>Loading...</>
                        ) : (
                            <>
                                <span>Load more results</span>
                                <ArrowRight className='h-4 w-4' />
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* End of results indicator */}
            {!hasNextPage && data.results.length > 0 && (
                <div className='text-center py-6 text-sm text-muted-foreground border-t'>
                    You've reached the end of search results
                </div>
            )}
        </div>
    );
};
