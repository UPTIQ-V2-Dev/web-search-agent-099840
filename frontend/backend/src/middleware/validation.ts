import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiError } from '@/utils/apiError';
import { isValidPassword } from '@/utils/passwordUtils';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? (error as any).value : undefined
        }));

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: errorMessages
        });
        return;
    }
    next();
};

// Auth validations
export const validateSignup = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('password').custom(value => {
        if (!isValidPassword(value)) {
            throw new Error(
                'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
            );
        }
        return true;
    }),

    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters long')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    handleValidationErrors
];

export const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('password').notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

export const validateRefreshToken = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),

    handleValidationErrors
];

// User management validations
export const validateCreateUser = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('password').custom(value => {
        if (!isValidPassword(value)) {
            throw new Error(
                'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
            );
        }
        return true;
    }),

    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters long')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('role').isIn(['USER', 'ADMIN']).withMessage('Role must be either USER or ADMIN'),

    handleValidationErrors
];

export const validateUpdateUser = [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters long')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Role must be either USER or ADMIN'),

    handleValidationErrors
];

export const validateUserId = [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),

    handleValidationErrors
];

// Search validations
export const validateSearch = [
    body('query')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Search query must be between 1 and 500 characters'),

    body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),

    body('filters.contentType')
        .optional()
        .isIn(['all', 'web', 'images', 'videos', 'news'])
        .withMessage('Content type must be one of: all, web, images, videos, news'),

    body('filters.sortBy')
        .optional()
        .isIn(['relevance', 'date', 'popularity'])
        .withMessage('Sort by must be one of: relevance, date, popularity'),

    body('filters.domain')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Domain filter must not exceed 100 characters'),

    handleValidationErrors
];

export const validateSearchSuggestions = [
    query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Query must be between 1 and 100 characters'),

    handleValidationErrors
];

// Search history validations
export const validateSearchHistoryQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),

    query('searchTerm')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search term must not exceed 100 characters'),

    query('fromDate').optional().isISO8601().withMessage('From date must be a valid ISO 8601 date'),

    query('toDate').optional().isISO8601().withMessage('To date must be a valid ISO 8601 date'),

    handleValidationErrors
];

export const validateSearchHistoryId = [
    param('id').isUUID().withMessage('Search history ID must be a valid UUID'),

    handleValidationErrors
];

export const validateSaveSearchHistory = [
    body('query')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Search query must be between 1 and 500 characters'),

    body('resultCount').isInt({ min: 0 }).withMessage('Result count must be a non-negative integer'),

    handleValidationErrors
];
