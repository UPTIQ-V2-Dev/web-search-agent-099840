import { searchController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { searchValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
// Web search endpoint
router.post('/web', auth('search'), validate(searchValidation.webSearch), searchController.performWebSearch);
// Search suggestions endpoint
router.get('/suggestions', auth('search'), validate(searchValidation.searchSuggestions), searchController.getSearchSuggestions);
// Search history endpoints
router
    .route('/history')
    .get(auth('search'), validate(searchValidation.getSearchHistory), searchController.getSearchHistory)
    .post(auth('search'), validate(searchValidation.saveSearchHistory), searchController.saveSearchHistory)
    .delete(auth('search'), searchController.clearSearchHistory);
// User search statistics endpoint
router.get('/history/stats', auth('search'), searchController.getUserSearchStats);
// Individual search history item endpoint
router
    .route('/history/:id')
    .delete(auth('search'), validate(searchValidation.deleteSearchHistoryItem), searchController.deleteSearchHistoryItem);
// System-wide statistics endpoint (admin only)
router.get('/stats', auth('manageSearch'), searchController.getSystemSearchStats);
// Cache management endpoint (admin only)
router.delete('/cache/clear', auth('manageSearch'), searchController.clearExpiredCache);
export default router;
/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Web search with history and caching
 */
/**
 * @swagger
 * /search/web:
 *   post:
 *     summary: Perform web search
 *     description: Search the web with filters and pagination. Results are cached for performance.
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
 *                 description: Search query
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Page number for pagination
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Number of results per page
 *               filters:
 *                 type: object
 *                 properties:
 *                   contentType:
 *                     type: string
 *                     enum: [web, news, images, videos]
 *                   sortBy:
 *                     type: string
 *                     enum: [relevance, date, popularity]
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
 *             example:
 *               query: "web development"
 *               page: 1
 *               limit: 10
 *               filters:
 *                 contentType: "web"
 *                 sortBy: "relevance"
 *     responses:
 *       "200":
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       url:
 *                         type: string
 *                       snippet:
 *                         type: string
 *                       domain:
 *                         type: string
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       contentType:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                 totalCount:
 *                   type: integer
 *                 searchTime:
 *                   type: number
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 hasNextPage:
 *                   type: boolean
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "429":
 *         $ref: '#/components/responses/TooManyRequests'
 */
/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Get search suggestions based on partial query input.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Partial search query
 *     responses:
 *       "200":
 *         description: Suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["web development", "web design", "web security"]
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /search/history:
 *   get:
 *     summary: Get user's search history
 *     description: Retrieve user's search history with pagination and optional filtering.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Filter by search term
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *     responses:
 *       "200":
 *         description: Search history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       query:
 *                         type: string
 *                       filters:
 *                         type: object
 *                         nullable: true
 *                       searchedAt:
 *                         type: string
 *                         format: date-time
 *                       resultCount:
 *                         type: integer
 *                 totalCount:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 hasNextPage:
 *                   type: boolean
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Save search to history
 *     description: Manually save a search query to user's history.
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
 *             example:
 *               query: "web development"
 *               resultCount: 15
 *               filters:
 *                 contentType: "web"
 *     responses:
 *       "201":
 *         description: Search saved to history successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 query:
 *                   type: string
 *                 filters:
 *                   type: object
 *                   nullable: true
 *                 searchedAt:
 *                   type: string
 *                   format: date-time
 *                 resultCount:
 *                   type: integer
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     summary: Clear all search history
 *     description: Clear all search history for the authenticated user.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: Search history cleared successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /search/history/{id}:
 *   delete:
 *     summary: Delete specific search history item
 *     description: Delete a specific search history item by ID.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Search history item ID
 *     responses:
 *       "204":
 *         description: Search history item deleted successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /search/history/stats:
 *   get:
 *     summary: Get user's search statistics
 *     description: Get statistics about user's search activity.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: User search statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSearches:
 *                   type: integer
 *                 uniqueQueries:
 *                   type: integer
 *                 averageResultCount:
 *                   type: number
 *                 mostSearchedQuery:
 *                   type: string
 *                   nullable: true
 *                 searchFrequency:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: integer
 *                     thisWeek:
 *                       type: integer
 *                     thisMonth:
 *                       type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /search/stats:
 *   get:
 *     summary: Get system-wide search statistics
 *     description: Get system-wide search statistics. Admin only.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: System search statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSearches:
 *                   type: integer
 *                 uniqueQueries:
 *                   type: integer
 *                 averageSearchTime:
 *                   type: number
 *                 cacheHitRate:
 *                   type: number
 *                 popularQueries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                       count:
 *                         type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
/**
 * @swagger
 * /search/cache/clear:
 *   delete:
 *     summary: Clear expired cache entries
 *     description: Clear all expired cache entries from the search cache. Admin only.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Expired cache entries cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clearedEntries:
 *                   type: integer
 *                 message:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
