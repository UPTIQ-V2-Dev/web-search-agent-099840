import { User, TokenType } from '@prisma/client';
import prisma from '@/config/database';
import { hashPassword, comparePassword } from '@/utils/passwordUtils';
import { generateAuthTokens, verifyToken, generateEmailVerificationToken } from '@/utils/tokenUtils';
import { AuthResponse, LoginRequest, SignupRequest } from '@/types';
import { ApiError } from '@/utils/apiError';
import logger from '@/config/logger';

export class AuthService {
    async register(userData: SignupRequest): Promise<AuthResponse> {
        const { name, email, password } = userData;

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
                password: hashedPassword
            }
        });

        logger.info(`New user registered: ${user.email}`, { userId: user.id });

        // Generate tokens
        const tokens = await generateAuthTokens(user.id);

        // Save refresh token to database
        await prisma.token.create({
            data: {
                token: tokens.refresh.token,
                type: TokenType.REFRESH,
                expires: tokens.refresh.expires,
                userId: user.id
            }
        });

        // Generate email verification token if email verification is enabled
        const emailVerificationToken = generateEmailVerificationToken(user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken,
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            tokens
        };
    }

    async login(loginData: LoginRequest): Promise<AuthResponse> {
        const { email, password } = loginData;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new ApiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        logger.info(`User logged in: ${user.email}`, { userId: user.id });

        // Generate tokens
        const tokens = await generateAuthTokens(user.id);

        // Save refresh token to database
        await prisma.token.create({
            data: {
                token: tokens.refresh.token,
                type: TokenType.REFRESH,
                expires: tokens.refresh.expires,
                userId: user.id
            }
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            tokens
        };
    }

    async refreshTokens(refreshToken: string): Promise<AuthResponse> {
        try {
            // Verify refresh token
            const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Find token in database
            const tokenRecord = await prisma.token.findFirst({
                where: {
                    token: refreshToken,
                    type: TokenType.REFRESH,
                    blacklisted: false,
                    expires: { gt: new Date() }
                },
                include: { user: true }
            });

            if (!tokenRecord) {
                throw new ApiError('Invalid refresh token', 'INVALID_TOKEN', 401);
            }

            // Generate new tokens
            const tokens = await generateAuthTokens(tokenRecord.user.id);

            // Blacklist old refresh token
            await prisma.token.update({
                where: { id: tokenRecord.id },
                data: { blacklisted: true }
            });

            // Save new refresh token
            await prisma.token.create({
                data: {
                    token: tokens.refresh.token,
                    type: TokenType.REFRESH,
                    expires: tokens.refresh.expires,
                    userId: tokenRecord.user.id
                }
            });

            logger.info(`Tokens refreshed for user: ${tokenRecord.user.email}`, { userId: tokenRecord.user.id });

            // Return user without password
            const { password: _, ...userWithoutPassword } = tokenRecord.user;

            return {
                user: userWithoutPassword,
                tokens
            };
        } catch (error) {
            throw new ApiError('Invalid refresh token', 'INVALID_TOKEN', 401);
        }
    }

    async logout(refreshToken: string): Promise<void> {
        // Blacklist refresh token
        await prisma.token.updateMany({
            where: { token: refreshToken },
            data: { blacklisted: true }
        });

        logger.info('User logged out');
    }

    async verifyEmail(token: string): Promise<void> {
        try {
            const payload = verifyToken(token);

            const user = await prisma.user.findFirst({
                where: {
                    id: payload.sub,
                    emailVerificationToken: token,
                    emailVerificationExpires: { gt: new Date() }
                }
            });

            if (!user) {
                throw new ApiError('Invalid or expired verification token', 'INVALID_TOKEN', 400);
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isEmailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpires: null
                }
            });

            logger.info(`Email verified for user: ${user.email}`, { userId: user.id });
        } catch (error) {
            throw new ApiError('Invalid or expired verification token', 'INVALID_TOKEN', 400);
        }
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
}
