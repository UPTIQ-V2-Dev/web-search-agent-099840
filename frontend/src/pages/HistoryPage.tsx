import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Search, Trash2, CalendarDays, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { getSearchHistory, deleteSearchHistoryItem, clearSearchHistory } from '@/services/historyApi';
import type { SearchHistoryQuery, SearchHistoryItem } from '@/types/history';

export const HistoryPage = () => {
    const [query, setQuery] = useState<SearchHistoryQuery>({
        page: 1,
        limit: 20
    });
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const {
        data: historyData,
        isLoading,
        error
    } = useQuery({
        queryKey: ['searchHistory', query],
        queryFn: () => getSearchHistory(query)
    });

    const deleteItemMutation = useMutation({
        mutationFn: deleteSearchHistoryItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
        }
    });

    const clearHistoryMutation = useMutation({
        mutationFn: clearSearchHistory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
        }
    });

    const handleSearch = (term: string) => {
        setQuery(prev => ({
            ...prev,
            searchTerm: term || undefined,
            page: 1
        }));
    };

    const handleDeleteItem = (id: string) => {
        deleteItemMutation.mutate(id);
    };

    const handleClearHistory = () => {
        clearHistoryMutation.mutate();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className='min-h-screen bg-background'>
            <div className='max-w-4xl mx-auto px-4 py-8'>
                <div className='mb-8'>
                    <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                            <History className='h-6 w-6 text-primary' />
                            <h1 className='text-2xl font-bold'>Search History</h1>
                        </div>
                        {historyData && historyData.items.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                    >
                                        <Trash2 className='h-4 w-4 mr-2' />
                                        Clear All
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear Search History</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete all your search
                                            history.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearHistory}>
                                            Clear History
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    <p className='text-muted-foreground'>View and manage your previous searches</p>
                </div>

                {/* Search Filter */}
                <div className='mb-6'>
                    <div className='flex gap-2'>
                        <Input
                            placeholder='Search your history...'
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className='max-w-sm'
                        />
                        <Button onClick={() => handleSearch(searchTerm)}>
                            <Search className='h-4 w-4 mr-2' />
                            Search
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className='space-y-4'>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className='p-6'>
                                    <div className='animate-pulse space-y-3'>
                                        <div className='h-4 bg-muted rounded w-3/4'></div>
                                        <div className='h-3 bg-muted rounded w-1/2'></div>
                                        <div className='h-3 bg-muted rounded w-1/4'></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className='border-destructive'>
                        <CardContent className='p-6 text-center'>
                            <div className='text-destructive'>
                                <History className='h-8 w-8 mx-auto mb-2' />
                                <p>Failed to load search history</p>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='mt-2'
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['searchHistory'] })}
                                >
                                    <RotateCcw className='h-4 w-4 mr-2' />
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* History Items */}
                {historyData && (
                    <>
                        {historyData.items.length === 0 ? (
                            <Card className='border-dashed'>
                                <CardContent className='flex flex-col items-center justify-center py-12'>
                                    <div className='rounded-full bg-muted p-4 mb-4'>
                                        <History className='h-8 w-8 text-muted-foreground' />
                                    </div>
                                    <div className='text-center space-y-2'>
                                        <h3 className='text-lg font-medium'>No search history</h3>
                                        <p className='text-muted-foreground max-w-sm'>
                                            {query.searchTerm
                                                ? `No search history found matching "${query.searchTerm}"`
                                                : 'Your search history will appear here once you start searching'}
                                        </p>
                                    </div>
                                    <Link to='/'>
                                        <Button className='mt-4'>
                                            <Search className='h-4 w-4 mr-2' />
                                            Start Searching
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className='space-y-4'>
                                {historyData.items.map((item: SearchHistoryItem) => (
                                    <Card
                                        key={item.id}
                                        className='hover:shadow-sm transition-shadow'
                                    >
                                        <CardContent className='p-6'>
                                            <div className='flex items-start justify-between gap-4'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-2 mb-2'>
                                                        <h3 className='font-medium text-foreground truncate'>
                                                            {item.query}
                                                        </h3>
                                                        <Badge
                                                            variant='secondary'
                                                            className='text-xs shrink-0'
                                                        >
                                                            {item.resultCount} results
                                                        </Badge>
                                                    </div>

                                                    <div className='flex items-center gap-4 text-sm text-muted-foreground mb-3'>
                                                        <div className='flex items-center gap-1'>
                                                            <CalendarDays className='h-3 w-3' />
                                                            {formatDate(item.searchedAt)}
                                                        </div>
                                                    </div>

                                                    {item.filters && Object.keys(item.filters).length > 0 && (
                                                        <div className='flex flex-wrap gap-1'>
                                                            {Object.entries(item.filters).map(
                                                                ([key, value]) =>
                                                                    value && (
                                                                        <Badge
                                                                            key={key}
                                                                            variant='outline'
                                                                            className='text-xs'
                                                                        >
                                                                            {key}: {value}
                                                                        </Badge>
                                                                    )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className='flex items-center gap-2'>
                                                    <Link to={`/?q=${encodeURIComponent(item.query)}`}>
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                        >
                                                            <Search className='h-4 w-4' />
                                                        </Button>
                                                    </Link>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant='ghost'
                                                                size='sm'
                                                            >
                                                                <Trash2 className='h-4 w-4' />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Search</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this search from
                                                                    your history?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {historyData.totalPages > 1 && (
                            <div className='flex items-center justify-between mt-8'>
                                <p className='text-sm text-muted-foreground'>
                                    Showing {historyData.items.length} of {historyData.totalCount} results
                                </p>
                                <div className='flex gap-2'>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        disabled={historyData.currentPage <= 1}
                                        onClick={() =>
                                            setQuery(prev => ({
                                                ...prev,
                                                page: Math.max(1, prev.page! - 1)
                                            }))
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        disabled={!historyData.hasNextPage}
                                        onClick={() =>
                                            setQuery(prev => ({
                                                ...prev,
                                                page: (prev.page || 1) + 1
                                            }))
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
