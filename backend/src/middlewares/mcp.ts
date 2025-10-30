import { NextFunction, Request, Response } from 'express';

export const mcpAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // MCP endpoints no longer require API key authentication
    // Session validation is handled in the controllers
    next();
};
