import { searchService } from "../services/index.js";
import { z } from 'zod';
// Define common schemas
const searchResultSchema = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
    domain: z.string(),
    publishedAt: z.string(),
    contentType: z.string(),
    metadata: z
        .object({
        author: z.string().optional(),
        wordCount: z.number().optional()
    })
        .optional()
});
const searchHistoryItemSchema = z.object({
    id: z.string(),
    query: z.string(),
    filters: z.any().nullable(),
    searchedAt: z.string(),
    resultCount: z.number()
});
const performWebSearchTool = {
    id: 'search_web',
    name: 'Perform Web Search',
    description: 'Search the web with filters and pagination. Results are cached for performance.',
    inputSchema: z.object({
        userId: z.number().int(),
        query: z.string().min(1).max(500),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(50).optional().default(10),
        filters: z
            .object({
            contentType: z.enum(['web', 'news', 'images', 'videos']).optional(),
            sortBy: z.enum(['relevance', 'date', 'popularity']).optional(),
            domain: z.string().optional(),
            dateRange: z
                .object({
                from: z.string().datetime().optional(),
                to: z.string().datetime().optional()
            })
                .optional()
        })
            .optional()
    }),
    outputSchema: z.object({
        results: z.array(searchResultSchema),
        totalCount: z.number(),
        searchTime: z.number(),
        currentPage: z.number(),
        totalPages: z.number(),
        hasNextPage: z.boolean(),
        suggestions: z.array(z.string())
    }),
    fn: async (inputs) => {
        const { userId, query, page, limit, filters } = inputs;
        const result = await searchService.performWebSearchWithCache(userId, query, {
            page,
            limit,
            filters
        });
        return result;
    }
};
const getSearchSuggestionsTool = {
    id: 'search_get_suggestions',
    name: 'Get Search Suggestions',
    description: 'Get search suggestions based on partial query input.',
    inputSchema: z.object({
        query: z.string().min(1).max(100)
    }),
    outputSchema: z.object({
        suggestions: z.array(z.string())
    }),
    fn: async (inputs) => {
        const { query } = inputs;
        const suggestions = await searchService.getSearchSuggestions(query);
        return { suggestions };
    }
};
const getUserSearchHistoryTool = {
    id: 'search_get_history',
    name: 'Get User Search History',
    description: "Retrieve user's search history with pagination and optional filtering.",
    inputSchema: z.object({
        userId: z.number().int(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
        searchTerm: z.string().optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional()
    }),
    outputSchema: z.object({
        items: z.array(searchHistoryItemSchema),
        totalCount: z.number(),
        currentPage: z.number(),
        totalPages: z.number(),
        hasNextPage: z.boolean()
    }),
    fn: async (inputs) => {
        const { userId, ...options } = inputs;
        const result = await searchService.getUserSearchHistory(userId, options);
        return result;
    }
};
const saveSearchToHistoryTool = {
    id: 'search_save_history',
    name: 'Save Search to History',
    description: "Manually save a search query to user's history.",
    inputSchema: z.object({
        userId: z.number().int(),
        query: z.string().min(1).max(500),
        resultCount: z.number().int().min(0),
        filters: z.any().optional()
    }),
    outputSchema: z.object({
        id: z.string(),
        query: z.string(),
        filters: z.any().nullable(),
        searchedAt: z.string(),
        resultCount: z.number()
    }),
    fn: async (inputs) => {
        const { userId, query, resultCount, filters } = inputs;
        const historyItem = await searchService.saveSearchToHistory(userId, {
            query,
            resultCount,
            filters
        });
        return {
            id: historyItem.id,
            query: historyItem.query,
            filters: historyItem.filters ? JSON.parse(historyItem.filters) : null,
            searchedAt: historyItem.createdAt.toISOString(),
            resultCount: historyItem.resultCount
        };
    }
};
const clearSearchHistoryTool = {
    id: 'search_clear_history',
    name: 'Clear Search History',
    description: 'Clear all search history for a user.',
    inputSchema: z.object({
        userId: z.number().int()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        const { userId } = inputs;
        await searchService.clearUserSearchHistory(userId);
        return { success: true };
    }
};
const deleteSearchHistoryItemTool = {
    id: 'search_delete_history_item',
    name: 'Delete Search History Item',
    description: 'Delete a specific search history item by ID.',
    inputSchema: z.object({
        userId: z.number().int(),
        historyId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        const { userId, historyId } = inputs;
        await searchService.deleteSearchHistoryItem(userId, historyId);
        return { success: true };
    }
};
const getUserSearchStatsTool = {
    id: 'search_get_user_stats',
    name: 'Get User Search Statistics',
    description: "Get statistics about user's search activity.",
    inputSchema: z.object({
        userId: z.number().int()
    }),
    outputSchema: z.object({
        totalSearches: z.number(),
        uniqueQueries: z.number(),
        averageResultCount: z.number(),
        mostSearchedQuery: z.string().nullable(),
        searchFrequency: z.object({
            today: z.number(),
            thisWeek: z.number(),
            thisMonth: z.number()
        })
    }),
    fn: async (inputs) => {
        const { userId } = inputs;
        const stats = await searchService.getUserSearchStats(userId);
        return stats;
    }
};
const getSystemSearchStatsTool = {
    id: 'search_get_system_stats',
    name: 'Get System Search Statistics',
    description: 'Get system-wide search statistics. Admin only.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        totalSearches: z.number(),
        uniqueQueries: z.number(),
        averageSearchTime: z.number(),
        cacheHitRate: z.number(),
        popularQueries: z.array(z.object({
            query: z.string(),
            count: z.number()
        }))
    }),
    fn: async () => {
        const stats = await searchService.getSystemSearchStats();
        return stats;
    }
};
const clearExpiredCacheTool = {
    id: 'search_clear_cache',
    name: 'Clear Expired Cache',
    description: 'Clear all expired cache entries from the search cache. Admin only.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        clearedEntries: z.number(),
        message: z.string()
    }),
    fn: async () => {
        const result = await searchService.clearExpiredCache();
        return result;
    }
};
export const searchTools = [
    performWebSearchTool,
    getSearchSuggestionsTool,
    getUserSearchHistoryTool,
    saveSearchToHistoryTool,
    clearSearchHistoryTool,
    deleteSearchHistoryItemTool,
    getUserSearchStatsTool,
    getSystemSearchStatsTool,
    clearExpiredCacheTool
];
