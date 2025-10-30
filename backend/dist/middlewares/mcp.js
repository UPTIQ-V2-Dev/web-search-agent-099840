export const mcpAuthMiddleware = (req, res, next) => {
    // MCP endpoints no longer require API key authentication
    // Session validation is handled in the controllers
    next();
};
