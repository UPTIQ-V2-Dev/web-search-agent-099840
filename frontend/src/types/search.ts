export interface SearchFilters {
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    domain?: string;
    contentType?: 'all' | 'web' | 'images' | 'videos' | 'news';
    sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    publishedAt: string;
    contentType: 'web' | 'images' | 'videos' | 'news';
    metadata?: {
        author?: string;
        wordCount?: number;
        imageUrl?: string;
        videoLength?: string;
    };
}

export interface SearchResponse {
    results: SearchResult[];
    totalCount: number;
    searchTime: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    suggestions?: string[];
}

export interface SearchQuery {
    query: string;
    filters?: SearchFilters;
    page?: number;
    limit?: number;
}

export interface SearchHistoryItem {
    id: string;
    query: string;
    filters?: SearchFilters;
    searchedAt: string;
    resultCount: number;
}
