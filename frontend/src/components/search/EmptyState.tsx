import { Search, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    query?: string;
    suggestions?: string[];
    onSuggestionClick?: (suggestion: string) => void;
}

export const EmptyState = ({ query, suggestions, onSuggestionClick }: EmptyStateProps) => {
    const hasQuery = Boolean(query?.trim());

    return (
        <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center py-12 px-6'>
                <div className='rounded-full bg-muted p-4 mb-4'>
                    <Search className='h-8 w-8 text-muted-foreground' />
                </div>

                <div className='text-center space-y-2 mb-6'>
                    <h3 className='text-lg font-medium'>{hasQuery ? 'No results found' : 'Ready to search'}</h3>
                    <p className='text-muted-foreground max-w-sm'>
                        {hasQuery
                            ? `We couldn't find any results for "${query}". Try different keywords or check your spelling.`
                            : 'Enter your search query above to find relevant content across the web.'}
                    </p>
                </div>

                {/* Search suggestions */}
                {suggestions && suggestions.length > 0 && (
                    <div className='space-y-3 w-full max-w-md'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Lightbulb className='h-4 w-4' />
                            <span>Try searching for:</span>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {suggestions.map((suggestion, index) => (
                                <Button
                                    key={`${suggestion}-${index}`}
                                    variant='outline'
                                    size='sm'
                                    onClick={() => onSuggestionClick?.(suggestion)}
                                    className='text-xs'
                                >
                                    {suggestion}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Default search tips if no query */}
                {!hasQuery && (
                    <div className='mt-8 space-y-2 text-center text-sm text-muted-foreground'>
                        <p className='font-medium'>Search tips:</p>
                        <ul className='space-y-1 text-xs'>
                            <li>• Use specific keywords for better results</li>
                            <li>• Try different search terms if you don't find what you're looking for</li>
                            <li>• Use filters to narrow down your search</li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
