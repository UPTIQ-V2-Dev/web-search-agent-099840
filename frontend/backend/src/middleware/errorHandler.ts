import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';
import { config } from '@/config';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    // Handle ApiError instances
    if (error instanceof ApiError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code || 'API_ERROR';
        details = error.details;
    }
    // Handle Prisma errors
    else if (error.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;

        switch (prismaError.code) {
            case 'P2002':
                statusCode = 400;
                message = 'A record with this information already exists';
                code = 'DUPLICATE_RECORD';
                details = { field: prismaError.meta?.target };
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                code = 'RECORD_NOT_FOUND';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Foreign key constraint failed';
                code = 'FOREIGN_KEY_CONSTRAINT';
                break;
            default:
                statusCode = 500;
                message = 'Database error';
                code = 'DATABASE_ERROR';
        }
    }
    // Handle Prisma validation errors
    else if (error.constructor.name === 'PrismaClientValidationError') {
        statusCode = 400;
        message = 'Invalid data provided';
        code = 'VALIDATION_ERROR';
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    // Handle other common errors
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
        code = 'VALIDATION_ERROR';
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
        code = 'INVALID_FORMAT';
    }

    // Log error details
    if (statusCode >= 500) {
        logger.error('Server Error:', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query,
            user: (req as any).user?.id
        });
    } else {
        logger.warn('Client Error:', {
            message: error.message,
            url: req.url,
            method: req.method,
            statusCode,
            user: (req as any).user?.id
        });
    }

    // Send error response
    const errorResponse: any = {
        success: false,
        message,
        code
    };

    // Include details in development mode or for client errors
    if (details && (config.env === 'development' || statusCode < 500)) {
        errorResponse.details = details;
    }

    // Include stack trace in development mode for server errors
    if (config.env === 'development' && statusCode >= 500) {
        errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        code: 'ROUTE_NOT_FOUND'
    });
};
