import { api } from '@/lib/api';
import type { SearchQuery, SearchResponse, SearchResult } from '@/types/search';
import { mockSearchResponse, mockSearchResults } from '@/data/mockData';
import { emitter } from '@/agentSdk';

export const searchWeb = async (searchQuery: SearchQuery): Promise<SearchResponse> => {
    try {
        // Use Web Search Agent for search (Rule 1 - Agent Sync Event Only)
        const agentResponse = await emitter.emit({
            agentId: '154a49c9-3b4a-470c-8317-85f308acba1b',
            event: 'search the web searchbox',
            payload: {
                query: searchQuery.query,
                filters: searchQuery.filters,
                page: searchQuery.page || 1,
                limit: searchQuery.limit || 10
            }
        });

        if (agentResponse && agentResponse.results) {
            // Transform agent response to match SearchResponse format
            const transformedResults: SearchResult[] = agentResponse.results.map((result: any, index: number) => ({
                id: `agent-result-${index}`,
                title: result.title || '',
                url: result.url || '',
                snippet: result.snippet || '',
                domain: result.domain || new URL(result.url || '').hostname || '',
                publishedAt: result.publishedDate || new Date().toISOString(),
                contentType: 'web' as const,
                metadata: {}
            }));

            return {
                results: transformedResults,
                totalCount: agentResponse.totalResults || transformedResults.length,
                searchTime: 0.5,
                currentPage: searchQuery.page || 1,
                totalPages: Math.ceil(
                    (agentResponse.totalResults || transformedResults.length) / (searchQuery.limit || 10)
                ),
                hasNextPage:
                    (searchQuery.page || 1) * (searchQuery.limit || 10) <
                    (agentResponse.totalResults || transformedResults.length),
                suggestions: []
            };
        }
    } catch (error) {
        console.error('Web Search Agent error, falling back to mock data:', error);
    }

    // Fallback to mock data if agent fails
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Filter results based on query for more realistic mock behavior
        const filteredResults = mockSearchResults.filter(
            result =>
                result.title.toLowerCase().includes(searchQuery.query.toLowerCase()) ||
                result.snippet.toLowerCase().includes(searchQuery.query.toLowerCase()) ||
                result.domain.toLowerCase().includes(searchQuery.query.toLowerCase())
        );

        return {
            ...mockSearchResponse,
            results: filteredResults,
            totalCount: filteredResults.length,
            totalPages: Math.ceil(filteredResults.length / (searchQuery.limit || 10)),
            hasNextPage: (searchQuery.page || 1) < Math.ceil(filteredResults.length / (searchQuery.limit || 10))
        };
    }

    const response = await api.post<SearchResponse>('/search/web', searchQuery);
    return response.data;
};

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 200));

        const suggestions = [
            'web search algorithms',
            'web development',
            'web design',
            'search engine optimization',
            'AI search technology',
            'React search components'
        ].filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()));

        return suggestions.slice(0, 5);
    }

    const response = await api.get<string[]>(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return response.data;
};
