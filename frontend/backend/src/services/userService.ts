import { User, UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { hashPassword } from '@/utils/passwordUtils';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';
import { PaginatedResponse } from '@/types';

export interface CreateUserRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
}

export interface GetUsersParams {
    name?: string;
    role?: UserRole;
    sortBy?: string;
    limit?: number;
    page?: number;
}

export class UserService {
    async createUser(userData: CreateUserRequest): Promise<Omit<User, 'password'>> {
        const { name, email, password, role } = userData;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            throw new ApiError('User with this email already exists', 'USER_EXISTS', 400);
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                isEmailVerified: true // Admin-created users are automatically verified
            },
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

        logger.info(`User created by admin: ${user.email}`, { userId: user.id });

        return user;
    }

    async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
        const user = await prisma.user.findUnique({
            where: { id },
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

        return user;
    }

    async getUsers(params: GetUsersParams): Promise<PaginatedResponse<Omit<User, 'password'>>> {
        const { name, role, sortBy = 'createdAt', limit = 10, page = 1 } = params;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive'
            };
        }

        if (role) {
            where.role = role;
        }

        // Build order by clause
        const orderBy: any = {};
        switch (sortBy) {
            case 'name':
                orderBy.name = 'asc';
                break;
            case 'email':
                orderBy.email = 'asc';
                break;
            case 'role':
                orderBy.role = 'asc';
                break;
            case 'lastLoginAt':
                orderBy.lastLoginAt = 'desc';
                break;
            default:
                orderBy.createdAt = 'desc';
        }

        // Execute query with pagination
        const [users, totalResults] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isEmailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLoginAt: true
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);

        const totalPages = Math.ceil(totalResults / limit);

        return {
            results: users,
            page,
            limit,
            totalPages,
            totalResults
        };
    }

    async updateUser(id: number, updateData: UpdateUserRequest): Promise<Omit<User, 'password'>> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
        }

        // Check email uniqueness if email is being updated
        if (updateData.email && updateData.email.toLowerCase() !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email.toLowerCase() }
            });

            if (emailExists) {
                throw new ApiError('Email is already in use', 'EMAIL_EXISTS', 400);
            }
        }

        // Prepare update data
        const dataToUpdate: any = {};

        if (updateData.name !== undefined) {
            dataToUpdate.name = updateData.name;
        }

        if (updateData.email !== undefined) {
            dataToUpdate.email = updateData.email.toLowerCase();
            dataToUpdate.isEmailVerified = false; // Reset email verification if email changes
        }

        if (updateData.role !== undefined) {
            dataToUpdate.role = updateData.role;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
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

        logger.info(`User updated: ${updatedUser.email}`, { userId: updatedUser.id });

        return updatedUser;
    }

    async deleteUser(id: number): Promise<void> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
        }

        // Delete user (this will cascade delete related tokens and search history)
        await prisma.user.delete({
            where: { id }
        });

        logger.info(`User deleted: ${existingUser.email}`, { userId: id });
    }

    async getUserStats(): Promise<{
        totalUsers: number;
        adminUsers: number;
        regularUsers: number;
        verifiedUsers: number;
        unverifiedUsers: number;
        recentUsers: number; // Users created in the last 30 days
    }> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalUsers, adminUsers, regularUsers, verifiedUsers, unverifiedUsers, recentUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: UserRole.ADMIN } }),
            prisma.user.count({ where: { role: UserRole.USER } }),
            prisma.user.count({ where: { isEmailVerified: true } }),
            prisma.user.count({ where: { isEmailVerified: false } }),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
        ]);

        return {
            totalUsers,
            adminUsers,
            regularUsers,
            verifiedUsers,
            unverifiedUsers,
            recentUsers
        };
    }
}
