import axios from 'axios';
import { SearchQuery, SearchResult, SearchResponse } from '@/types';
import { config } from '@/config';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

export class BingSearchProvider {
    private apiKey: string;
    private baseUrl = 'https://api.bing.microsoft.com/v7.0/search';

    constructor() {
        this.apiKey = config.search.bingApiKey;
        if (!this.apiKey) {
            logger.warn('Bing Search API key not configured');
        }
    }

    async search(searchQuery: SearchQuery): Promise<SearchResponse> {
        if (!this.apiKey) {
            throw new ApiError('Bing Search API key not configured', 'SEARCH_API_NOT_CONFIGURED', 500);
        }

        const startTime = Date.now();

        try {
            const params: any = {
                q: searchQuery.query,
                count: searchQuery.limit || 10,
                offset: ((searchQuery.page || 1) - 1) * (searchQuery.limit || 10),
                mkt: 'en-US',
                safesearch: 'Moderate'
            };

            // Apply filters
            if (searchQuery.filters) {
                if (searchQuery.filters.domain) {
                    params.q = `${searchQuery.query} site:${searchQuery.filters.domain}`;
                }

                if (searchQuery.filters.dateRange?.from || searchQuery.filters.dateRange?.to) {
                    if (searchQuery.filters.dateRange.from && searchQuery.filters.dateRange.to) {
                        const fromDate = searchQuery.filters.dateRange.from.toISOString().split('T')[0];
                        const toDate = searchQuery.filters.dateRange.to.toISOString().split('T')[0];
                        params.q += ` after:${fromDate} before:${toDate}`;
                    }
                }

                if (searchQuery.filters.sortBy === 'date') {
                    params.sortby = 'Date';
                }
            }

            const headers = {
                'Ocp-Apim-Subscription-Key': this.apiKey,
                'Content-Type': 'application/json'
            };

            const endpoint = this.getEndpoint(searchQuery.filters?.contentType);
            const response = await axios.get(endpoint, {
                params,
                headers,
                timeout: 30000 // 30 seconds
            });

            const searchTime = Date.now() - startTime;

            return this.transformResponse(response.data, searchQuery, searchTime);
        } catch (error: any) {
            logger.error('Bing Search API error:', error);

            if (error.response?.status === 401) {
                throw new ApiError('Invalid Bing Search API key', 'INVALID_API_KEY', 500);
            }

            if (error.response?.status === 429) {
                throw new ApiError('Search rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
            }

            throw new ApiError('Search service temporarily unavailable', 'SEARCH_SERVICE_ERROR', 503);
        }
    }

    private getEndpoint(contentType?: string): string {
        switch (contentType) {
            case 'images':
                return 'https://api.bing.microsoft.com/v7.0/images/search';
            case 'videos':
                return 'https://api.bing.microsoft.com/v7.0/videos/search';
            case 'news':
                return 'https://api.bing.microsoft.com/v7.0/news/search';
            default:
                return this.baseUrl;
        }
    }

    private transformResponse(data: any, searchQuery: SearchQuery, searchTime: number): SearchResponse {
        const results: SearchResult[] = [];
        const contentType = searchQuery.filters?.contentType || 'web';

        // Handle web search results
        if (data.webPages?.value) {
            for (let i = 0; i < data.webPages.value.length; i++) {
                const result = data.webPages.value[i];

                results.push({
                    id: `bing_web_${i}_${Date.now()}`,
                    title: result.name || '',
                    url: result.url || '',
                    snippet: result.snippet || '',
                    domain: this.extractDomain(result.url || ''),
                    publishedAt: result.dateLastCrawled || new Date().toISOString(),
                    contentType: 'web',
                    metadata: {
                        wordCount: result.snippet ? result.snippet.split(' ').length : 0
                    }
                });
            }
        }

        // Handle image results
        if (data.value && contentType === 'images') {
            for (let i = 0; i < data.value.length; i++) {
                const result = data.value[i];

                results.push({
                    id: `bing_img_${i}_${Date.now()}`,
                    title: result.name || '',
                    url: result.webSearchUrl || result.contentUrl || '',
                    snippet: result.name || '',
                    domain: this.extractDomain(result.hostPageUrl || ''),
                    publishedAt: new Date().toISOString(),
                    contentType: 'images',
                    metadata: {
                        imageUrl: result.contentUrl
                    }
                });
            }
        }

        // Handle video results
        if (data.value && contentType === 'videos') {
            for (let i = 0; i < data.value.length; i++) {
                const result = data.value[i];

                results.push({
                    id: `bing_vid_${i}_${Date.now()}`,
                    title: result.name || '',
                    url: result.webSearchUrl || result.contentUrl || '',
                    snippet: result.description || '',
                    domain: this.extractDomain(result.hostPageUrl || ''),
                    publishedAt: result.datePublished || new Date().toISOString(),
                    contentType: 'videos',
                    metadata: {
                        videoLength: result.duration,
                        author: result.creator?.name
                    }
                });
            }
        }

        // Handle news results
        if (data.value && contentType === 'news') {
            for (let i = 0; i < data.value.length; i++) {
                const result = data.value[i];

                results.push({
                    id: `bing_news_${i}_${Date.now()}`,
                    title: result.name || '',
                    url: result.url || '',
                    snippet: result.description || '',
                    domain: this.extractDomain(result.url || ''),
                    publishedAt: result.datePublished || new Date().toISOString(),
                    contentType: 'news',
                    metadata: {
                        author: result.provider?.[0]?.name
                    }
                });
            }
        }

        const currentPage = searchQuery.page || 1;
        const limit = searchQuery.limit || 10;
        const totalCount = data.webPages?.totalEstimatedMatches || data.totalEstimatedMatches || results.length;
        const totalPages = Math.ceil(totalCount / limit);

        return {
            results: results.slice(0, limit),
            totalCount,
            searchTime,
            currentPage,
            totalPages,
            hasNextPage: currentPage < totalPages,
            suggestions: data.relatedSearches?.value?.map((s: any) => s.text) || []
        };
    }

    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return '';
        }
    }
}
