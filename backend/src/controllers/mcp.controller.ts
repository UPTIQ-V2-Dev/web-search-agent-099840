import { JSONRPC_INTERNAL_ERROR, JSONRPC_INVALID_REQUEST } from '../constants/jsonrpc.constants.ts';
import { registerMCPTools } from '../services/mcp.service.ts';
import { searchTools } from '../tools/search.tool.ts';
import { userTools } from '../tools/user.tool.ts';
import catchAsync from '../utils/catchAsync.ts';
import { Server } from '@modelcontextprotocol/sdk/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { v4 as uuid } from 'uuid';

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport | undefined } = {};
// Map to store server instances by session ID
const servers: { [sessionId: string]: Server | undefined } = {};

export const mcpPostController = catchAsync(async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;
    let server: Server;

    // Validate JSON-RPC request format
    if (!req.body || !req.body.method) {
        return res.status(httpStatus.BAD_REQUEST).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INVALID_REQUEST,
                message: 'Invalid JSON-RPC request'
            },
            id: req.body?.id || null
        });
    }

    // Handle session initialization
    if (!sessionId && isInitializeRequest(req.body)) {
        const newSessionId = uuid();

        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => newSessionId,
            onsessioninitialized: (id: string) => {
                console.log('New MCP session initialized:', id);
                transports[id] = transport;
                servers[id] = server;
            }
        });

        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
                delete servers[transport.sessionId];
            }
        };

        server = new Server(
            {
                name: 'app-builder-mcp-server',
                title: 'App Builder MCP Server',
                version: '1.0.0'
            },
            {
                capabilities: {
                    logging: {},
                    tools: {}
                }
            }
        );

        registerMCPTools({ server, tools: [...userTools, ...searchTools] });
        await server.connect(transport);
    } else if (sessionId && transports[sessionId]) {
        // Use existing session
        transport = transports[sessionId]!;
        server = servers[sessionId]!;
    } else {
        return res.status(httpStatus.BAD_REQUEST).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INVALID_REQUEST,
                message: 'Invalid Request: Invalid or missing session ID'
            },
            id: req.body?.id || null
        });
    }

    try {
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INTERNAL_ERROR,
                message: 'Internal server error'
            },
            id: req.body?.id || null
        });
    }
});

export const mcpGetController = catchAsync((req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            error: 'Missing session ID'
        });
    }

    if (!transports[sessionId]) {
        return res.status(httpStatus.NOT_FOUND).json({
            error: 'Session not found'
        });
    }

    try {
        // Get capabilities from available tools
        const allTools = [...userTools, ...searchTools];
        const capabilities = allTools.map(tool => tool.id);

        res.status(httpStatus.OK).json({
            sessionId,
            status: 'active',
            capabilities
        });
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Internal server error'
        });
    }
});

export const mcpDeleteController = catchAsync(async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            error: 'Missing session ID'
        });
    }

    if (!transports[sessionId]) {
        return res.status(httpStatus.NOT_FOUND).json({
            error: 'Session not found'
        });
    }

    try {
        const transport = transports[sessionId];

        // Clean up the session
        if (transport.sessionId) {
            delete transports[transport.sessionId];
            delete servers[transport.sessionId];
        }

        // Close transport if it has a close method
        if (typeof transport.close === 'function') {
            await transport.close();
        }

        res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Internal server error'
        });
    }
});
