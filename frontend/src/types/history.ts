import type { SearchFilters } from './search';

export interface SearchHistoryItem {
    id: string;
    query: string;
    filters?: SearchFilters;
    searchedAt: string;
    resultCount: number;
}

export interface SearchHistoryResponse {
    items: SearchHistoryItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
}

export interface SearchHistoryQuery {
    page?: number;
    limit?: number;
    searchTerm?: string;
    dateRange?: {
        from?: Date;
        to?: Date;
    };
}
