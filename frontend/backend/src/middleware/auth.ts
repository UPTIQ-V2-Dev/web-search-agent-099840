import { Request, Response, NextFunction } from 'express';
import { TokenType, UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { verifyToken } from '@/utils/tokenUtils';
import { ApiError } from '@/utils/apiError';
import { AuthenticatedRequest } from '@/types';
import logger from '@/config/logger';
import { config } from '@/config';

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError('Access denied. No token provided.', 'NO_TOKEN', 401);
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const payload = verifyToken(token, config.jwt.accessSecret);

        // Check if token is blacklisted
        const tokenRecord = await prisma.token.findFirst({
            where: {
                token,
                type: TokenType.ACCESS,
                blacklisted: true
            }
        });

        if (tokenRecord) {
            throw new ApiError('Token has been invalidated', 'BLACKLISTED_TOKEN', 401);
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true
            }
        });

        if (!user) {
            throw new ApiError('User not found', 'USER_NOT_FOUND', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code
            });
        } else {
            logger.error('Authentication error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
    }
};

export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.isEmailVerified) {
        res.status(403).json({
            success: false,
            message: 'Email verification required',
            code: 'EMAIL_NOT_VERIFIED'
        });
        return;
    }
    next();
};

export const requireRole = (roles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }

        next();
    };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
