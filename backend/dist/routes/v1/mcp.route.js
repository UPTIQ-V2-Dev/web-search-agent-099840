import { mcpDeleteController, mcpGetController, mcpPostController } from "../../controllers/mcp.controller.js";
import { mcpAuthMiddleware } from "../../middlewares/mcp.js";
import express from 'express';
const router = express.Router();
router.use(mcpAuthMiddleware);
/**
 * @swagger
 * tags:
 *   name: MCP
 *   description: Model Context Protocol endpoints for AI tool integration
 */
/**
 * @swagger
 * /mcp:
 *   post:
 *     summary: Initialize MCP session or execute MCP tools
 *     description: Handle JSON-RPC requests to initialize new MCP sessions or execute MCP tools on existing sessions
 *     tags: [MCP]
 *     parameters:
 *       - in: header
 *         name: mcp-session-id
 *         schema:
 *           type: string
 *         description: Optional session ID for existing sessions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               jsonrpc:
 *                 type: string
 *                 example: "2.0"
 *               method:
 *                 type: string
 *                 example: "user_get_all"
 *               params:
 *                 type: object
 *                 example: {"page": 1, "limit": 10}
 *               id:
 *                 type: string
 *                 example: "1"
 *           example:
 *             jsonrpc: "2.0"
 *             method: "user_get_all"
 *             params: {"page": 1, "limit": 10}
 *             id: "1"
 *     responses:
 *       200:
 *         description: JSON-RPC response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jsonrpc:
 *                   type: string
 *                   example: "2.0"
 *                 result:
 *                   type: object
 *                   example: {"users": [{"id": 1, "email": "john@example.com", "name": "John Doe", "role": "USER"}], "pagination": {"page": 1, "limit": 10, "total": 1}}
 *                 id:
 *                   type: string
 *                   example: "1"
 *       400:
 *         description: Invalid JSON-RPC request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jsonrpc:
 *                   type: string
 *                   example: "2.0"
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: integer
 *                       example: -32600
 *                     message:
 *                       type: string
 *                       example: "Invalid JSON-RPC request"
 *                 id:
 *                   nullable: true
 *       500:
 *         description: Internal server error
 */
router.post('/', mcpPostController);
/**
 * @swagger
 * /mcp:
 *   get:
 *     summary: Handle GET requests for MCP sessions
 *     description: Get session status and capabilities for an MCP session
 *     tags: [MCP]
 *     parameters:
 *       - in: header
 *         name: mcp-session-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *         example: "uuid-session"
 *     responses:
 *       200:
 *         description: Session status and capabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "uuid-session"
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 capabilities:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["user_create", "user_get_all", "user_get_by_id", "user_update", "user_delete"]
 *       400:
 *         description: Missing session ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing session ID"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Session not found"
 *       500:
 *         description: Internal server error
 */
router.get('/', mcpGetController);
/**
 * @swagger
 * /mcp:
 *   delete:
 *     summary: Clean up and terminate MCP session
 *     description: Terminate an MCP session and clean up associated resources
 *     tags: [MCP]
 *     parameters:
 *       - in: header
 *         name: mcp-session-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to terminate
 *         example: "uuid-session"
 *     responses:
 *       204:
 *         description: Session terminated successfully
 *       400:
 *         description: Missing session ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing session ID"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Session not found"
 *       500:
 *         description: Internal server error
 */
router.delete('/', mcpDeleteController);
export default router;
