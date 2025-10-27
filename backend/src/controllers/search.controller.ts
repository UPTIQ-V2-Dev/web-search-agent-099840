import { searchService } from '../services/index.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const performWebSearch = catchAsyncWithAuth(async (req, res) => {
    const { query, page, limit, filters } = req.body;
    const userId = req.user.id;

    const results = await searchService.performWebSearchWithCache(userId, query, {
        page,
        limit,
        filters
    });

    res.status(httpStatus.OK).send(results);
});

const getSearchSuggestions = catchAsyncWithAuth(async (req, res) => {
    const { q } = req.validatedQuery;

    const suggestions = await searchService.getSearchSuggestions(q);

    res.status(httpStatus.OK).send(suggestions);
});

const getSearchHistory = catchAsyncWithAuth(async (req, res) => {
    const userId = req.user.id;
    const options = pick(req.validatedQuery, ['page', 'limit', 'searchTerm', 'fromDate', 'toDate']);

    const history = await searchService.getUserSearchHistory(userId, options);

    res.status(httpStatus.OK).send(history);
});

const saveSearchHistory = catchAsyncWithAuth(async (req, res) => {
    const userId = req.user.id;
    const { query, resultCount, filters } = req.body;

    const historyItem = await searchService.saveSearchToHistory(userId, {
        query,
        resultCount,
        filters
    });

    // Format the response to match the API spec
    const response = {
        id: historyItem.id,
        query: historyItem.query,
        filters: historyItem.filters ? JSON.parse(historyItem.filters) : null,
        searchedAt: historyItem.createdAt.toISOString(),
        resultCount: historyItem.resultCount
    };

    res.status(httpStatus.CREATED).send(response);
});

const clearSearchHistory = catchAsyncWithAuth(async (req, res) => {
    const userId = req.user.id;

    await searchService.clearUserSearchHistory(userId);

    res.status(httpStatus.NO_CONTENT).send();
});

const deleteSearchHistoryItem = catchAsyncWithAuth(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    await searchService.deleteSearchHistoryItem(userId, id);

    res.status(httpStatus.NO_CONTENT).send();
});

const getUserSearchStats = catchAsyncWithAuth(async (req, res) => {
    const userId = req.user.id;

    const stats = await searchService.getUserSearchStats(userId);

    res.status(httpStatus.OK).send(stats);
});

const getSystemSearchStats = catchAsyncWithAuth(async (req, res) => {
    // This endpoint is admin-only, auth middleware should handle the permission check
    const stats = await searchService.getSystemSearchStats();

    res.status(httpStatus.OK).send(stats);
});

const clearExpiredCache = catchAsyncWithAuth(async (req, res) => {
    // This endpoint is admin-only, auth middleware should handle the permission check
    const result = await searchService.clearExpiredCache();

    res.status(httpStatus.OK).send(result);
});

export default {
    performWebSearch,
    getSearchSuggestions,
    getSearchHistory,
    saveSearchHistory,
    clearSearchHistory,
    deleteSearchHistoryItem,
    getUserSearchStats,
    getSystemSearchStats,
    clearExpiredCache
};
