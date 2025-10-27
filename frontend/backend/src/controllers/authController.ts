import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { LoginRequest, SignupRequest, AuthenticatedRequest } from '@/types';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userData: SignupRequest = req.body;
            const result = await authService.register(userData);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const loginData: LoginRequest = req.body;
            const result = await authService.login(loginData);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new ApiError('Refresh token is required', 'MISSING_REFRESH_TOKEN', 400);
            }

            const result = await authService.refreshTokens(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Tokens refreshed successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new ApiError('Refresh token is required', 'MISSING_REFRESH_TOKEN', 400);
            }

            await authService.logout(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token } = req.params;

            if (!token) {
                throw new ApiError('Verification token is required', 'MISSING_TOKEN', 400);
            }

            await authService.verifyEmail(token);

            res.status(200).json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
            }

            const user = await authService.getUserById(req.user.id);

            if (!user) {
                throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
            }

            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async checkAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('User not authenticated', 'NOT_AUTHENTICATED', 401);
            }

            res.status(200).json({
                success: true,
                message: 'User is authenticated',
                data: { user: req.user }
            });
        } catch (error) {
            next(error);
        }
    }
}
