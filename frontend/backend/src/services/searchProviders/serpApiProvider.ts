import axios from 'axios';
import { SearchQuery, SearchResult, SearchResponse } from '@/types';
import { config } from '@/config';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

export class SerpApiProvider {
    private apiKey: string;
    private baseUrl = 'https://serpapi.com/search.json';

    constructor() {
        this.apiKey = config.search.serpApiKey;
        if (!this.apiKey) {
            logger.warn('SERP API key not configured');
        }
    }

    async search(searchQuery: SearchQuery): Promise<SearchResponse> {
        if (!this.apiKey) {
            throw new ApiError('SERP API key not configured', 'SEARCH_API_NOT_CONFIGURED', 500);
        }

        const startTime = Date.now();

        try {
            const params: any = {
                api_key: this.apiKey,
                engine: 'google',
                q: searchQuery.query,
                num: searchQuery.limit || 10,
                start: ((searchQuery.page || 1) - 1) * (searchQuery.limit || 10)
            };

            // Apply filters
            if (searchQuery.filters) {
                const { filters } = searchQuery.filters;

                if (filters.domain) {
                    params.q = `${searchQuery.query} site:${filters.domain}`;
                }

                if (filters.dateRange?.from || filters.dateRange?.to) {
                    if (filters.dateRange.from && filters.dateRange.to) {
                        const fromDate = filters.dateRange.from.toISOString().split('T')[0];
                        const toDate = filters.dateRange.to.toISOString().split('T')[0];
                        params.tbs = `cdr:1,cd_min:${fromDate},cd_max:${toDate}`;
                    }
                }

                if (filters.contentType && filters.contentType !== 'all') {
                    switch (filters.contentType) {
                        case 'images':
                            params.tbm = 'isch';
                            break;
                        case 'videos':
                            params.tbm = 'vid';
                            break;
                        case 'news':
                            params.tbm = 'nws';
                            break;
                    }
                }

                if (filters.sortBy === 'date') {
                    params.sort = 'date';
                }
            }

            const response = await axios.get(this.baseUrl, {
                params,
                timeout: 30000 // 30 seconds
            });

            const searchTime = Date.now() - startTime;

            return this.transformResponse(response.data, searchQuery, searchTime);
        } catch (error: any) {
            logger.error('SERP API error:', error);

            if (error.response?.status === 401) {
                throw new ApiError('Invalid SERP API key', 'INVALID_API_KEY', 500);
            }

            if (error.response?.status === 429) {
                throw new ApiError('Search rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
            }

            throw new ApiError('Search service temporarily unavailable', 'SEARCH_SERVICE_ERROR', 503);
        }
    }

    private transformResponse(data: any, searchQuery: SearchQuery, searchTime: number): SearchResponse {
        const results: SearchResult[] = [];
        const organicResults = data.organic_results || [];

        for (let i = 0; i < organicResults.length; i++) {
            const result = organicResults[i];

            results.push({
                id: `serp_${i}_${Date.now()}`,
                title: result.title || '',
                url: result.link || '',
                snippet: result.snippet || '',
                domain: this.extractDomain(result.link || ''),
                publishedAt: result.date || new Date().toISOString(),
                contentType: this.getContentType(searchQuery.filters?.contentType),
                metadata: {
                    wordCount: result.snippet ? result.snippet.split(' ').length : 0
                }
            });
        }

        // Handle image results
        if (data.images_results) {
            for (let i = 0; i < data.images_results.length; i++) {
                const result = data.images_results[i];

                results.push({
                    id: `serp_img_${i}_${Date.now()}`,
                    title: result.title || '',
                    url: result.link || '',
                    snippet: result.title || '',
                    domain: this.extractDomain(result.source || ''),
                    publishedAt: new Date().toISOString(),
                    contentType: 'images',
                    metadata: {
                        imageUrl: result.original
                    }
                });
            }
        }

        // Handle video results
        if (data.video_results) {
            for (let i = 0; i < data.video_results.length; i++) {
                const result = data.video_results[i];

                results.push({
                    id: `serp_vid_${i}_${Date.now()}`,
                    title: result.title || '',
                    url: result.link || '',
                    snippet: result.snippet || '',
                    domain: this.extractDomain(result.link || ''),
                    publishedAt: result.date || new Date().toISOString(),
                    contentType: 'videos',
                    metadata: {
                        videoLength: result.duration,
                        author: result.channel
                    }
                });
            }
        }

        // Handle news results
        if (data.news_results) {
            for (let i = 0; i < data.news_results.length; i++) {
                const result = data.news_results[i];

                results.push({
                    id: `serp_news_${i}_${Date.now()}`,
                    title: result.title || '',
                    url: result.link || '',
                    snippet: result.snippet || '',
                    domain: this.extractDomain(result.source || ''),
                    publishedAt: result.date || new Date().toISOString(),
                    contentType: 'news',
                    metadata: {
                        author: result.source
                    }
                });
            }
        }

        const currentPage = searchQuery.page || 1;
        const limit = searchQuery.limit || 10;
        const totalCount = data.search_information?.total_results || results.length;
        const totalPages = Math.ceil(totalCount / limit);

        return {
            results: results.slice(0, limit),
            totalCount,
            searchTime,
            currentPage,
            totalPages,
            hasNextPage: currentPage < totalPages,
            suggestions: data.related_searches?.map((s: any) => s.query) || []
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

    private getContentType(filterType?: string): 'web' | 'images' | 'videos' | 'news' {
        switch (filterType) {
            case 'images':
                return 'images';
            case 'videos':
                return 'videos';
            case 'news':
                return 'news';
            default:
                return 'web';
        }
    }
}
