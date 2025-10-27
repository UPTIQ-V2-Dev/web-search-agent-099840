import { Router } from 'express';
import { SearchController } from '@/controllers/searchController';
import { authenticate, requireAdmin } from '@/middleware/auth';
import {
    validateSearch,
    validateSearchSuggestions,
    validateSearchHistoryQuery,
    validateSearchHistoryId,
    validateSaveSearchHistory
} from '@/middleware/validation';
import rateLimit from 'express-rate-limit';

const router = Router();
const searchController = new SearchController();

// Rate limiting for search endpoints
const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 search requests per windowMs
    message: {
        success: false,
        message: 'Too many search requests, please try again later',
        code: 'SEARCH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const suggestionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 suggestion requests per minute
    message: {
        success: false,
        message: 'Too many suggestion requests, please try again later',
        code: 'SUGGESTION_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * @swagger
 * /api/v1/search/web:
 *   post:
 *     summary: Perform web search
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *               filters:
 *                 type: object
 *                 properties:
 *                   contentType:
 *                     type: string
 *                     enum: [all, web, images, videos, news]
 *                     default: all
 *                   sortBy:
 *                     type: string
 *                     enum: [relevance, date, popularity]
 *                     default: relevance
 *                   domain:
 *                     type: string
 *                   dateRange:
 *                     type: object
 *                     properties:
 *                       from:
 *                         type: string
 *                         format: date-time
 *                       to:
 *                         type: string
 *                         format: date-time
 *     responses:
 *       200:
 *         description: Search completed successfully
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Authentication required
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: Search service unavailable
 */
router.post('/web', authenticate, searchLimiter, validateSearch, searchController.searchWeb);

/**
 * @swagger
 * /api/v1/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
 *       400:
 *         description: Query parameter is required
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/suggestions', suggestionLimiter, validateSearchSuggestions, searchController.getSearchSuggestions);

/**
 * @swagger
 * /api/v1/search/history:
 *   get:
 *     summary: Get user's search history
 *     tags: [Search History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Search history retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/history', authenticate, validateSearchHistoryQuery, searchController.getSearchHistory);

/**
 * @swagger
 * /api/v1/search/history:
 *   post:
 *     summary: Save search to history
 *     tags: [Search History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - resultCount
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *               resultCount:
 *                 type: integer
 *                 minimum: 0
 *               filters:
 *                 type: object
 *     responses:
 *       201:
 *         description: Search saved to history successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/history', authenticate, validateSaveSearchHistory, searchController.saveSearchToHistory);

/**
 * @swagger
 * /api/v1/search/history:
 *   delete:
 *     summary: Clear all search history
 *     tags: [Search History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search history cleared successfully
 *       401:
 *         description: Authentication required
 */
router.delete('/history', authenticate, searchController.clearSearchHistory);

/**
 * @swagger
 * /api/v1/search/history/stats:
 *   get:
 *     summary: Get search history statistics
 *     tags: [Search History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search history statistics retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/history/stats', authenticate, searchController.getSearchHistoryStats);

/**
 * @swagger
 * /api/v1/search/history/{id}:
 *   delete:
 *     summary: Delete specific search history item
 *     tags: [Search History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Search history item deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Search history item not found
 */
router.delete('/history/:id', authenticate, validateSearchHistoryId, searchController.deleteSearchHistoryItem);

/**
 * @swagger
 * /api/v1/search/stats:
 *   get:
 *     summary: Get search statistics (Admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search statistics retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/stats', authenticate, requireAdmin, searchController.getSearchStats);

/**
 * @swagger
 * /api/v1/search/cache/clear:
 *   delete:
 *     summary: Clear expired cache entries (Admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired cache entries cleared successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.delete('/cache/clear', authenticate, requireAdmin, searchController.clearExpiredCache);

export default router;
