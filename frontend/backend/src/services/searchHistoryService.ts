import { SearchContentType } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

export interface SearchHistoryItem {
    id: string;
    query: string;
    filters?: {
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        domain?: string;
        contentType?: 'all' | 'web' | 'images' | 'videos' | 'news';
        sortBy?: 'relevance' | 'date' | 'popularity';
    };
    searchedAt: string;
    resultCount: number;
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

export interface SearchHistoryResponse {
    items: SearchHistoryItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
}

export class SearchHistoryService {
    async saveSearchHistory(
        userId: number,
        query: string,
        resultCount: number,
        filters?: SearchHistoryItem['filters']
    ): Promise<SearchHistoryItem> {
        try {
            const searchHistory = await prisma.searchHistory.create({
                data: {
                    query,
                    userId,
                    resultCount,
                    dateRangeFrom: filters?.dateRange?.from,
                    dateRangeTo: filters?.dateRange?.to,
                    domain: filters?.domain,
                    contentType: this.mapContentType(filters?.contentType),
                    sortBy: filters?.sortBy || 'relevance'
                }
            });

            logger.info('Search history saved', {
                userId,
                query,
                historyId: searchHistory.id
            });

            return this.transformToHistoryItem(searchHistory);
        } catch (error) {
            logger.error('Error saving search history:', error);
            throw new ApiError('Failed to save search history', 'SAVE_HISTORY_ERROR', 500);
        }
    }

    async getSearchHistory(userId: number, queryParams: SearchHistoryQuery = {}): Promise<SearchHistoryResponse> {
        try {
            const { page = 1, limit = 10, searchTerm, dateRange } = queryParams;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {
                userId
            };

            if (searchTerm) {
                where.query = {
                    contains: searchTerm,
                    mode: 'insensitive'
                };
            }

            if (dateRange?.from || dateRange?.to) {
                where.searchedAt = {};
                if (dateRange.from) {
                    where.searchedAt.gte = dateRange.from;
                }
                if (dateRange.to) {
                    where.searchedAt.lte = dateRange.to;
                }
            }

            // Execute query with pagination
            const [items, totalCount] = await Promise.all([
                prisma.searchHistory.findMany({
                    where,
                    orderBy: {
                        searchedAt: 'desc'
                    },
                    skip,
                    take: limit
                }),
                prisma.searchHistory.count({ where })
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            return {
                items: items.map(item => this.transformToHistoryItem(item)),
                totalCount,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages
            };
        } catch (error) {
            logger.error('Error getting search history:', error);
            throw new ApiError('Failed to retrieve search history', 'GET_HISTORY_ERROR', 500);
        }
    }

    async deleteSearchHistoryItem(userId: number, historyId: string): Promise<void> {
        try {
            // Check if the history item belongs to the user
            const historyItem = await prisma.searchHistory.findFirst({
                where: {
                    id: historyId,
                    userId
                }
            });

            if (!historyItem) {
                throw new ApiError('Search history item not found', 'HISTORY_NOT_FOUND', 404);
            }

            await prisma.searchHistory.delete({
                where: {
                    id: historyId
                }
            });

            logger.info('Search history item deleted', {
                userId,
                historyId
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error deleting search history item:', error);
            throw new ApiError('Failed to delete search history item', 'DELETE_HISTORY_ERROR', 500);
        }
    }

    async clearSearchHistory(userId: number): Promise<void> {
        try {
            const deletedCount = await prisma.searchHistory.deleteMany({
                where: {
                    userId
                }
            });

            logger.info('Search history cleared', {
                userId,
                deletedCount: deletedCount.count
            });
        } catch (error) {
            logger.error('Error clearing search history:', error);
            throw new ApiError('Failed to clear search history', 'CLEAR_HISTORY_ERROR', 500);
        }
    }

    async getSearchHistoryStats(userId: number): Promise<{
        totalSearches: number;
        searchesThisWeek: number;
        searchesToday: number;
        topQueries: Array<{ query: string; count: number }>;
        searchesByContentType: Array<{ contentType: string; count: number }>;
    }> {
        try {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - 7);

            const [totalSearches, searchesToday, searchesThisWeek, topQueries, searchesByContentType] =
                await Promise.all([
                    // Total searches
                    prisma.searchHistory.count({
                        where: { userId }
                    }),

                    // Searches today
                    prisma.searchHistory.count({
                        where: {
                            userId,
                            searchedAt: { gte: startOfToday }
                        }
                    }),

                    // Searches this week
                    prisma.searchHistory.count({
                        where: {
                            userId,
                            searchedAt: { gte: startOfWeek }
                        }
                    }),

                    // Top queries (grouped by query text)
                    prisma.$queryRaw`
          SELECT query, COUNT(*) as count
          FROM search_history
          WHERE "userId" = ${userId}
          GROUP BY query
          ORDER BY COUNT(*) DESC
          LIMIT 5
        ` as Array<{ query: string; count: bigint }>,

                    // Searches by content type
                    prisma.$queryRaw`
          SELECT "contentType", COUNT(*) as count
          FROM search_history
          WHERE "userId" = ${userId}
          GROUP BY "contentType"
          ORDER BY COUNT(*) DESC
        ` as Array<{ contentType: SearchContentType; count: bigint }>
                ]);

            return {
                totalSearches,
                searchesToday,
                searchesThisWeek,
                topQueries: topQueries.map(q => ({
                    query: q.query,
                    count: Number(q.count)
                })),
                searchesByContentType: searchesByContentType.map(s => ({
                    contentType: s.contentType.toLowerCase(),
                    count: Number(s.count)
                }))
            };
        } catch (error) {
            logger.error('Error getting search history stats:', error);
            throw new ApiError('Failed to retrieve search history statistics', 'STATS_ERROR', 500);
        }
    }

    private mapContentType(contentType?: string): SearchContentType {
        switch (contentType) {
            case 'images':
                return SearchContentType.IMAGES;
            case 'videos':
                return SearchContentType.VIDEOS;
            case 'news':
                return SearchContentType.NEWS;
            default:
                return SearchContentType.WEB;
        }
    }

    private transformToHistoryItem(historyRecord: any): SearchHistoryItem {
        const filters: SearchHistoryItem['filters'] = {};

        if (historyRecord.dateRangeFrom || historyRecord.dateRangeTo) {
            filters.dateRange = {
                from: historyRecord.dateRangeFrom,
                to: historyRecord.dateRangeTo
            };
        }

        if (historyRecord.domain) {
            filters.domain = historyRecord.domain;
        }

        if (historyRecord.contentType) {
            filters.contentType = historyRecord.contentType.toLowerCase() as any;
        }

        if (historyRecord.sortBy) {
            filters.sortBy = historyRecord.sortBy as any;
        }

        return {
            id: historyRecord.id,
            query: historyRecord.query,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
            searchedAt: historyRecord.searchedAt.toISOString(),
            resultCount: historyRecord.resultCount
        };
    }
}
