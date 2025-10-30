import prisma from '../client.ts';
import { User } from '../generated/prisma/index.js';
import { AuthTokensResponse } from '../types/response.ts';
import ApiError from '../utils/ApiError.ts';
import { encryptPassword, isPasswordMatch } from '../utils/encryption.ts';
import tokenService from './token.service.ts';
import userService from './user.service.ts';
import httpStatus from 'http-status';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Omit<User, 'password'>>}
 */
const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<Omit<User, 'password'>> => {
    const user = (await userService.getUserByEmail(email, true)) as User;
    if (!user || !(await isPasswordMatch(password, user.password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string): Promise<void> => {
    const refreshTokenData = await prisma.token.findFirst({
        where: {
            token: refreshToken,
            type: 'REFRESH',
            blacklisted: false
        }
    });
    if (!refreshTokenData) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Refresh token not found');
    }
    await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
    try {
        const refreshTokenData = await tokenService.verifyToken(refreshToken, 'REFRESH');
        const { userId } = refreshTokenData;
        await prisma.token.delete({ where: { id: refreshTokenData.id } });
        return tokenService.generateAuthTokens({ id: userId });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
    try {
        const resetPasswordTokenData = await tokenService.verifyToken(resetPasswordToken, 'RESET_PASSWORD');
        const user = await userService.getUserById(resetPasswordTokenData.userId, true);
        if (!user) {
            throw new Error();
        }
        await userService.updateUserById((user as User).id, { password: newPassword });
        await prisma.token.deleteMany({ where: { userId: (user as User).id, type: 'RESET_PASSWORD' } });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
    }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
    try {
        const verifyEmailTokenData = await tokenService.verifyToken(verifyEmailToken, 'VERIFY_EMAIL');
        await prisma.token.deleteMany({
            where: { userId: verifyEmailTokenData.userId, type: 'VERIFY_EMAIL' }
        });
        await userService.updateUserById(verifyEmailTokenData.userId, { isEmailVerified: true });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
    }
};

export default {
    loginUserWithEmailAndPassword,
    isPasswordMatch,
    encryptPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail
};
