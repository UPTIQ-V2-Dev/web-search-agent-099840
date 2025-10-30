import prisma from '../client.ts';
import { SearchHistory } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

// Mock web search function - in a real implementation, this would integrate with search engines
const performWebSearch = (query: string, filters?: any): any => {
    // This is a mock implementation - replace with actual search engine integration
    const startTime = Date.now();

    // Mock search results
    const mockResults = [
        {
            id: '1',
            title: `${query} - Complete Guide`,
            url: `https://example.com/${query.replace(' ', '-')}`,
            snippet: `Learn everything about ${query}. This comprehensive guide covers all aspects...`,
            domain: 'example.com',
            publishedAt: new Date().toISOString(),
            contentType: filters?.contentType || 'web',
            metadata: {
                author: 'John Smith',
                wordCount: 2000
            }
        },
        {
            id: '2',
            title: `${query} Tutorial`,
            url: `https://tutorial.com/${query.replace(' ', '-')}`,
            snippet: `Step by step tutorial for ${query}. Easy to follow instructions...`,
            domain: 'tutorial.com',
            publishedAt: new Date().toISOString(),
            contentType: filters?.contentType || 'web',
            metadata: {
                author: 'Jane Doe',
                wordCount: 1500
            }
        }
    ];

    const searchTime = (Date.now() - startTime) / 1000;
    const totalCount = mockResults.length + Math.floor(Math.random() * 20);

    return {
        results: mockResults,
        totalCount,
        searchTime
    };
};

/**
 * Perform web search with caching
 * @param {number} userId - User ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
const performWebSearchWithCache = async (
    userId: number,
    query: string,
    options: {
        page?: number;
        limit?: number;
        filters?: any;
    } = {}
): Promise<any> => {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const filters = options.filters || {};

    // Create cache key
    const cacheKey = `search:${query}:${JSON.stringify(filters)}:${page}:${limit}`;

    // Check cache first
    const cachedResult = await prisma.searchCache.findUnique({
        where: { cacheKey }
    });

    if (cachedResult && cachedResult.expiresAt > new Date()) {
        // Update hit count
        await prisma.searchCache.update({
            where: { id: cachedResult.id },
            data: { hitCount: { increment: 1 } }
        });

        const results = JSON.parse(cachedResult.results);

        // Save to user's search history
        await createSearchHistory(userId, {
            query,
            resultCount: results.totalCount,
            searchTime: results.searchTime,
            filters: JSON.stringify(filters)
        });

        return {
            ...results,
            currentPage: page,
            totalPages: Math.ceil(results.totalCount / limit),
            hasNextPage: page < Math.ceil(results.totalCount / limit),
            suggestions: generateSearchSuggestions(query)
        };
    }

    // Perform actual search
    const searchResults = await performWebSearch(query, filters);

    // Cache the results for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.searchCache.upsert({
        where: { cacheKey },
        update: {
            results: JSON.stringify(searchResults),
            hitCount: { increment: 1 },
            expiresAt
        },
        create: {
            cacheKey,
            results: JSON.stringify(searchResults),
            expiresAt
        }
    });

    // Save to user's search history
    await createSearchHistory(userId, {
        query,
        resultCount: searchResults.totalCount,
        searchTime: searchResults.searchTime,
        filters: JSON.stringify(filters)
    });

    return {
        ...searchResults,
        currentPage: page,
        totalPages: Math.ceil(searchResults.totalCount / limit),
        hasNextPage: page < Math.ceil(searchResults.totalCount / limit),
        suggestions: generateSearchSuggestions(query)
    };
};

/**
 * Generate search suggestions based on query
 * @param {string} query - Search query
 * @returns {string[]} Array of suggestions
 */
const generateSearchSuggestions = (query: string): string[] => {
    // Mock implementation - in reality, this would use a suggestion service
    const suggestions = [
        `${query} tutorial`,
        `${query} guide`,
        `${query} examples`,
        `${query} best practices`,
        `${query} tips`
    ];

    return suggestions.slice(0, 5);
};

/**
 * Get search suggestions
 * @param {string} query - Partial search query
 * @returns {Promise<string[]>} Array of suggestions
 */
const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) {
        return [];
    }

    // Get popular queries that start with the input
    const popularQueries = await prisma.searchHistory.groupBy({
        by: ['query'],
        _count: { query: true },
        where: {
            query: {
                contains: query,
                mode: 'insensitive'
            }
        },
        orderBy: {
            _count: {
                query: 'desc'
            }
        },
        take: 5
    });

    const suggestions = popularQueries.map(item => item.query);

    // Add generated suggestions if we don't have enough
    if (suggestions.length < 5) {
        const generated = generateSearchSuggestions(query);
        suggestions.push(...generated.slice(0, 5 - suggestions.length));
    }

    return suggestions;
};

/**
 * Create search history entry
 * @param {number} userId - User ID
 * @param {Object} historyData - Search history data
 * @returns {Promise<SearchHistory>} Created search history
 */
const createSearchHistory = async (
    userId: number,
    historyData: {
        query: string;
        resultCount: number;
        searchTime: number;
        filters?: string;
    }
): Promise<SearchHistory> => {
    return await prisma.searchHistory.create({
        data: {
            userId,
            query: historyData.query,
            resultCount: historyData.resultCount,
            searchTime: historyData.searchTime,
            filters: historyData.filters
        }
    });
};

/**
 * Get user's search history with pagination and filtering
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated search history
 */
const getUserSearchHistory = async (
    userId: number,
    options: {
        page?: number;
        limit?: number;
        searchTerm?: string;
        fromDate?: string;
        toDate?: string;
    } = {}
): Promise<{
    items: Array<{
        id: string;
        query: string;
        filters: any;
        searchedAt: string;
        resultCount: number;
    }>;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
}> => {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (options.searchTerm) {
        where.query = {
            contains: options.searchTerm,
            mode: 'insensitive'
        };
    }

    if (options.fromDate || options.toDate) {
        where.createdAt = {};
        if (options.fromDate) {
            where.createdAt.gte = new Date(options.fromDate);
        }
        if (options.toDate) {
            where.createdAt.lte = new Date(options.toDate);
        }
    }

    const [items, totalCount] = await Promise.all([
        prisma.searchHistory.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.searchHistory.count({ where })
    ]);

    return {
        items: items.map(item => ({
            id: item.id,
            query: item.query,
            filters: item.filters ? JSON.parse(item.filters) : null,
            searchedAt: item.createdAt.toISOString(),
            resultCount: item.resultCount
        })),
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit)
    };
};

/**
 * Save search query to history
 * @param {number} userId - User ID
 * @param {Object} searchData - Search data
 * @returns {Promise<SearchHistory>} Created search history
 */
const saveSearchToHistory = async (
    userId: number,
    searchData: {
        query: string;
        resultCount: number;
        filters?: any;
    }
): Promise<SearchHistory> => {
    return await prisma.searchHistory.create({
        data: {
            userId,
            query: searchData.query,
            resultCount: searchData.resultCount,
            searchTime: 0, // Will be updated with actual search time
            filters: searchData.filters ? JSON.stringify(searchData.filters) : null
        }
    });
};

/**
 * Clear all search history for user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const clearUserSearchHistory = async (userId: number): Promise<void> => {
    await prisma.searchHistory.deleteMany({
        where: { userId }
    });
};

/**
 * Delete specific search history item
 * @param {number} userId - User ID
 * @param {string} historyId - History item ID
 * @returns {Promise<void>}
 */
const deleteSearchHistoryItem = async (userId: number, historyId: string): Promise<void> => {
    const historyItem = await prisma.searchHistory.findFirst({
        where: {
            id: historyId,
            userId
        }
    });

    if (!historyItem) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Search history item not found');
    }

    await prisma.searchHistory.delete({
        where: { id: historyId }
    });
};

/**
 * Get user's search statistics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User search statistics
 */
const getUserSearchStats = async (
    userId: number
): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageResultCount: number;
    mostSearchedQuery: string | null;
    searchFrequency: {
        today: number;
        thisWeek: number;
        thisMonth: number;
    };
}> => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSearches, uniqueQueries, avgResult, mostSearched, todayCount, weekCount, monthCount] =
        await Promise.all([
            prisma.searchHistory.count({ where: { userId } }),
            prisma.searchHistory.findMany({
                where: { userId },
                distinct: ['query'],
                select: { query: true }
            }),
            prisma.searchHistory.aggregate({
                where: { userId },
                _avg: { resultCount: true }
            }),
            prisma.searchHistory.groupBy({
                by: ['query'],
                where: { userId },
                _count: { query: true },
                orderBy: { _count: { query: 'desc' } },
                take: 1
            }),
            prisma.searchHistory.count({
                where: {
                    userId,
                    createdAt: { gte: today }
                }
            }),
            prisma.searchHistory.count({
                where: {
                    userId,
                    createdAt: { gte: thisWeek }
                }
            }),
            prisma.searchHistory.count({
                where: {
                    userId,
                    createdAt: { gte: thisMonth }
                }
            })
        ]);

    return {
        totalSearches,
        uniqueQueries: uniqueQueries.length,
        averageResultCount: avgResult._avg.resultCount || 0,
        mostSearchedQuery: mostSearched.length > 0 ? mostSearched[0].query : null,
        searchFrequency: {
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount
        }
    };
};

/**
 * Get system-wide search statistics (admin only)
 * @returns {Promise<Object>} System search statistics
 */
const getSystemSearchStats = async (): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageSearchTime: number;
    cacheHitRate: number;
    popularQueries: Array<{ query: string; count: number }>;
}> => {
    const [totalSearches, uniqueQueries, avgSearchTime, cacheStats, popularQueries] = await Promise.all([
        prisma.searchHistory.count(),
        prisma.searchHistory.findMany({
            distinct: ['query'],
            select: { query: true }
        }),
        prisma.searchHistory.aggregate({
            _avg: { searchTime: true }
        }),
        prisma.searchCache.aggregate({
            _sum: { hitCount: true },
            _count: { id: true }
        }),
        prisma.searchHistory.groupBy({
            by: ['query'],
            _count: { query: true },
            orderBy: { _count: { query: 'desc' } },
            take: 10
        })
    ]);

    const totalCacheHits = cacheStats._sum.hitCount || 0;
    const totalCacheEntries = cacheStats._count.id || 0;
    const cacheHitRate = totalCacheEntries > 0 ? totalCacheHits / (totalCacheEntries + totalSearches) : 0;

    return {
        totalSearches,
        uniqueQueries: uniqueQueries.length,
        averageSearchTime: avgSearchTime._avg.searchTime || 0,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        popularQueries: popularQueries.map(item => ({
            query: item.query,
            count: item._count.query
        }))
    };
};

/**
 * Clear expired cache entries (admin only)
 * @returns {Promise<Object>} Clear operation result
 */
const clearExpiredCache = async (): Promise<{
    clearedEntries: number;
    message: string;
}> => {
    const result = await prisma.searchCache.deleteMany({
        where: {
            expiresAt: {
                lt: new Date()
            }
        }
    });

    return {
        clearedEntries: result.count,
        message: 'Expired cache entries cleared successfully'
    };
};

export default {
    performWebSearchWithCache,
    getSearchSuggestions,
    getUserSearchHistory,
    saveSearchToHistory,
    clearUserSearchHistory,
    deleteSearchHistoryItem,
    getUserSearchStats,
    getSystemSearchStats,
    clearExpiredCache
};
