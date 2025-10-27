import { Request, Response, NextFunction } from 'express';
import { SearchService } from '@/services/searchService';
import { SearchHistoryService } from '@/services/searchHistoryService';
import { AuthenticatedRequest } from '@/types';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

const searchService = new SearchService();
const searchHistoryService = new SearchHistoryService();

export class SearchController {
    async searchWeb(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const searchQuery = req.body;

            if (!req.user) {
                throw new ApiError('Authentication required', 'AUTH_REQUIRED', 401);
            }

            logger.info('Web search initiated', {
                userId: req.user.id,
                query: searchQuery.query,
                filters: searchQuery.filters
            });

            // Perform search
            const searchResult = await searchService.search(searchQuery);

            // Save to search history
            try {
                await searchHistoryService.saveSearchHistory(
                    req.user.id,
                    searchQuery.query,
                    searchResult.totalCount,
                    searchQuery.filters
                );
            } catch (historyError) {
                // Don't fail the search if history saving fails
                logger.warn('Failed to save search history:', historyError);
            }

            res.status(200).json({
                success: true,
                message: 'Search completed successfully',
                data: searchResult
            });
        } catch (error) {
            next(error);
        }
    }

    async getSearchSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                throw new ApiError('Query parameter is required', 'MISSING_QUERY', 400);
            }

            const suggestions = await searchService.getSuggestions(q);

            res.status(200).json({
                success: true,
                message: 'Suggestions retrieved successfully',
                data: suggestions
            });
        } catch (error) {
            next(error);
        }
    }

    async getSearchHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('Authentication required', 'AUTH_REQUIRED', 401);
            }

            const { page = '1', limit = '10', searchTerm, fromDate, toDate } = req.query;

            const queryParams = {
                page: parseInt(page as string, 10),
                limit: parseInt(limit as string, 10),
                searchTerm: searchTerm as string,
                dateRange:
                    fromDate || toDate
                        ? {
                              from: fromDate ? new Date(fromDate as string) : undefined,
                              to: toDate ? new Date(toDate as string) : undefined
                          }
                        : undefined
            };

            const result = await searchHistoryService.getSearchHistory(req.user.id, queryParams);

            res.status(200).json({
                success: true,
                message: 'Search history retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteSearchHistoryItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('Authentication required', 'AUTH_REQUIRED', 401);
            }

            const { id } = req.params;

            await searchHistoryService.deleteSearchHistoryItem(req.user.id, id);

            res.status(200).json({
                success: true,
                message: 'Search history item deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async clearSearchHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('Authentication required', 'AUTH_REQUIRED', 401);
            }

            await searchHistoryService.clearSearchHistory(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Search history cleared successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async saveSearchToHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('Authentication required', 'AUTH_REQUIRED', 401);
            }

            const { query, resultCount, filters } = req.body;

            const historyItem = await searchHistoryService.saveSearchHistory(req.user.id, query, resultCount, filters);

            res.status(201).json({
                success: true,
                message: 'Search saved to history successfully',
                data: historyItem
            });
        } catch (error) {
            next(error);
        }
    }

    async getSearchHistoryStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('Authentication required', 'AUTH_REQUIRED', 401);
            }

            const stats = await searchHistoryService.getSearchHistoryStats(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Search history statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async getSearchStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // This endpoint might be admin-only in production
            const stats = await searchService.getSearchStats();

            res.status(200).json({
                success: true,
                message: 'Search statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async clearExpiredCache(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // This endpoint should be admin-only
            const deletedCount = await searchService.clearExpiredCache();

            res.status(200).json({
                success: true,
                message: `Cleared ${deletedCount} expired cache entries`,
                data: { deletedCount }
            });
        } catch (error) {
            next(error);
        }
    }
}
