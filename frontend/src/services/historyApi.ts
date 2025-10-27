import { api } from '@/lib/api';
import type { SearchHistoryQuery, SearchHistoryResponse, SearchHistoryItem } from '@/types/history';
import { mockSearchHistory } from '@/data/mockData';

export const getSearchHistory = async (query: SearchHistoryQuery = {}): Promise<SearchHistoryResponse> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 300));

        let filteredItems = [...mockSearchHistory];

        // Filter by search term if provided
        if (query.searchTerm) {
            filteredItems = filteredItems.filter(item =>
                item.query.toLowerCase().includes(query.searchTerm!.toLowerCase())
            );
        }

        // Filter by date range if provided
        if (query.dateRange?.from || query.dateRange?.to) {
            filteredItems = filteredItems.filter(item => {
                const itemDate = new Date(item.searchedAt);
                const fromDate = query.dateRange?.from;
                const toDate = query.dateRange?.to;

                if (fromDate && itemDate < fromDate) return false;
                if (toDate && itemDate > toDate) return false;
                return true;
            });
        }

        return {
            items: filteredItems,
            totalCount: filteredItems.length,
            currentPage: query.page || 1,
            totalPages: Math.ceil(filteredItems.length / (query.limit || 10)),
            hasNextPage: (query.page || 1) < Math.ceil(filteredItems.length / (query.limit || 10))
        };
    }

    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.searchTerm) params.append('searchTerm', query.searchTerm);
    if (query.dateRange?.from) params.append('fromDate', query.dateRange.from.toISOString());
    if (query.dateRange?.to) params.append('toDate', query.dateRange.to.toISOString());

    const response = await api.get<SearchHistoryResponse>(`/search/history?${params.toString()}`);
    return response.data;
};

export const deleteSearchHistoryItem = async (id: string): Promise<void> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 200));
        return;
    }

    await api.delete(`/search/history/${id}`);
};

export const clearSearchHistory = async (): Promise<void> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
    }

    await api.delete('/search/history');
};

export const saveSearchToHistory = async (searchQuery: string, resultCount: number): Promise<SearchHistoryItem> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 200));

        const newItem: SearchHistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            query: searchQuery,
            searchedAt: new Date().toISOString(),
            resultCount
        };

        return newItem;
    }

    const response = await api.post<SearchHistoryItem>('/search/history', {
        query: searchQuery,
        resultCount
    });

    return response.data;
};
