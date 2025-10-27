import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/userService';
import { AuthenticatedRequest } from '@/types';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

const userService = new UserService();

export class UserController {
    async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userData = req.body;
            const result = await userService.createUser(userData);

            logger.info(`User created by admin: ${result.email}`, {
                adminId: req.user?.id,
                createdUserId: result.id
            });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: { user: result }
            });
        } catch (error) {
            next(error);
        }
    }

    async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, role, sortBy, limit = '10', page = '1' } = req.query;

            const params = {
                name: name as string,
                role: role as any,
                sortBy: sortBy as string,
                limit: parseInt(limit as string, 10),
                page: parseInt(page as string, 10)
            };

            const result = await userService.getUsers(params);

            res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.id, 10);
            const user = await userService.getUserById(userId);

            if (!user) {
                throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
            }

            res.status(200).json({
                success: true,
                message: 'User retrieved successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.id, 10);
            const updateData = req.body;

            const result = await userService.updateUser(userId, updateData);

            logger.info(`User updated by admin: ${result.email}`, {
                adminId: req.user?.id,
                updatedUserId: result.id
            });

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: { user: result }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.id, 10);

            // Prevent self-deletion
            if (req.user?.id === userId) {
                throw new ApiError('You cannot delete your own account', 'CANNOT_DELETE_SELF', 400);
            }

            await userService.deleteUser(userId);

            logger.info(`User deleted by admin`, {
                adminId: req.user?.id,
                deletedUserId: userId
            });

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await userService.getUserStats();

            res.status(200).json({
                success: true,
                message: 'User statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ApiError('User not authenticated', 'NOT_AUTHENTICATED', 401);
            }

            const { name, email } = req.body;
            const updateData: any = {};

            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;

            const result = await userService.updateUser(req.user.id, updateData);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { user: result }
            });
        } catch (error) {
            next(error);
        }
    }
}
