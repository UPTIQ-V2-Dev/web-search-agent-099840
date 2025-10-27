import { SearchQuery, SearchResponse, SearchResult } from '@/types';
import { SerpApiProvider } from './searchProviders/serpApiProvider';
import { BingSearchProvider } from './searchProviders/bingProvider';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';
import prisma from '@/config/database';
import crypto from 'crypto';

export class SearchService {
    private serpApiProvider: SerpApiProvider;
    private bingProvider: BingSearchProvider;

    constructor() {
        this.serpApiProvider = new SerpApiProvider();
        this.bingProvider = new BingSearchProvider();
    }

    async search(searchQuery: SearchQuery): Promise<SearchResponse> {
        try {
            // Generate cache key
            const cacheKey = this.generateCacheKey(searchQuery);

            // Try to get cached results first
            const cachedResult = await this.getCachedResult(cacheKey);
            if (cachedResult) {
                logger.info('Returning cached search results', {
                    query: searchQuery.query,
                    cacheHit: true
                });
                return cachedResult;
            }

            // Try different search providers in order of preference
            let searchResult: SearchResponse;

            try {
                searchResult = await this.serpApiProvider.search(searchQuery);
                logger.info('Search completed using SERP API', {
                    query: searchQuery.query,
                    resultCount: searchResult.results.length
                });
            } catch (serpError) {
                logger.warn('SERP API failed, trying Bing', { error: serpError });

                try {
                    searchResult = await this.bingProvider.search(searchQuery);
                    logger.info('Search completed using Bing API', {
                        query: searchQuery.query,
                        resultCount: searchResult.results.length
                    });
                } catch (bingError) {
                    logger.error('All search providers failed', {
                        serpError,
                        bingError
                    });
                    throw new ApiError('Search service temporarily unavailable', 'ALL_PROVIDERS_FAILED', 503);
                }
            }

            // Cache the result
            await this.cacheResult(cacheKey, searchQuery, searchResult);

            return searchResult;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Unexpected search error:', error);
            throw new ApiError('Search service error', 'SEARCH_ERROR', 500);
        }
    }

    async getSuggestions(query: string): Promise<string[]> {
        try {
            // For simplicity, we'll generate suggestions based on common search patterns
            // In production, you might want to use a dedicated suggestion API
            const suggestions = [
                `${query} tutorial`,
                `${query} guide`,
                `${query} examples`,
                `best ${query}`,
                `how to ${query}`,
                `${query} vs`,
                `${query} 2024`,
                `free ${query}`
            ].filter(suggestion => suggestion !== query);

            return suggestions.slice(0, 5);
        } catch (error) {
            logger.error('Error generating suggestions:', error);
            return [];
        }
    }

    private generateCacheKey(searchQuery: SearchQuery): string {
        const queryString = JSON.stringify({
            query: searchQuery.query.toLowerCase().trim(),
            filters: searchQuery.filters,
            page: searchQuery.page,
            limit: searchQuery.limit
        });

        return crypto.createHash('md5').update(queryString).digest('hex');
    }

    private async getCachedResult(cacheKey: string): Promise<SearchResponse | null> {
        try {
            const cached = await prisma.searchCache.findFirst({
                where: {
                    queryHash: cacheKey,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });

            if (cached) {
                // Update hit count and last hit time
                await prisma.searchCache.update({
                    where: { id: cached.id },
                    data: {
                        hitCount: cached.hitCount + 1,
                        lastHitAt: new Date()
                    }
                });

                return cached.results as SearchResponse;
            }

            return null;
        } catch (error) {
            logger.error('Error retrieving cached result:', error);
            return null;
        }
    }

    private async cacheResult(cacheKey: string, searchQuery: SearchQuery, searchResult: SearchResponse): Promise<void> {
        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

            await prisma.searchCache.upsert({
                where: { queryHash: cacheKey },
                update: {
                    query: searchQuery.query,
                    filters: searchQuery.filters as any,
                    results: searchResult as any,
                    totalCount: searchResult.totalCount,
                    searchTime: searchResult.searchTime,
                    expiresAt,
                    hitCount: 0
                },
                create: {
                    queryHash: cacheKey,
                    query: searchQuery.query,
                    filters: searchQuery.filters as any,
                    results: searchResult as any,
                    totalCount: searchResult.totalCount,
                    searchTime: searchResult.searchTime,
                    expiresAt
                }
            });

            logger.debug('Search result cached', { cacheKey });
        } catch (error) {
            logger.error('Error caching search result:', error);
            // Don't throw error - caching failure shouldn't break the search
        }
    }

    async getSearchStats(): Promise<{
        totalSearches: number;
        uniqueQueries: number;
        avgSearchTime: number;
        cacheHitRate: number;
        popularQueries: Array<{ query: string; count: number }>;
    }> {
        try {
            const [totalCachedSearches, cacheStats, popularQueries] = await Promise.all([
                // Total number of cached searches
                prisma.searchCache.count(),

                // Cache hit statistics
                prisma.searchCache.aggregate({
                    _avg: { searchTime: true, hitCount: true },
                    _sum: { hitCount: true }
                }),

                // Popular queries (top 10)
                prisma.searchCache.findMany({
                    select: {
                        query: true,
                        hitCount: true
                    },
                    orderBy: {
                        hitCount: 'desc'
                    },
                    take: 10
                })
            ]);

            const totalHits = cacheStats._sum.hitCount || 0;
            const totalRequests = totalCachedSearches + totalHits;
            const cacheHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

            return {
                totalSearches: totalRequests,
                uniqueQueries: totalCachedSearches,
                avgSearchTime: cacheStats._avg.searchTime || 0,
                cacheHitRate: Math.round(cacheHitRate * 100) / 100,
                popularQueries: popularQueries.map(q => ({
                    query: q.query,
                    count: q.hitCount
                }))
            };
        } catch (error) {
            logger.error('Error getting search stats:', error);
            throw new ApiError('Failed to retrieve search statistics', 'STATS_ERROR', 500);
        }
    }

    async clearExpiredCache(): Promise<number> {
        try {
            const deleted = await prisma.searchCache.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });

            logger.info(`Cleared ${deleted.count} expired cache entries`);
            return deleted.count;
        } catch (error) {
            logger.error('Error clearing expired cache:', error);
            return 0;
        }
    }
}
