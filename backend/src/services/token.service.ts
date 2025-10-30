import prisma from '../client.ts';
import config from '../config/config.ts';
import { Token } from '../generated/prisma/index.js';
import { AuthTokensResponse } from '../types/response.ts';
import ApiError from '../utils/ApiError.ts';
import userService from './user.service.ts';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';

/**
 * Generate token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId: number, expires: Moment, type: string, secret = config.jwt.secret): string => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
        type
    };
    return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (
    token: string,
    userId: number,
    expires: Moment,
    type: string,
    blacklisted = false
): Promise<Token> => {
    const createdToken = await prisma.token.create({
        data: {
            token,
            userId: userId,
            expires: expires.toDate(),
            type,
            blacklisted
        }
    });
    return createdToken;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: string): Promise<Token> => {
    const payload = jwt.verify(token, config.jwt.secret);
    const userId = Number(payload.sub);
    const tokenData = await prisma.token.findFirst({
        where: { token, type, userId, blacklisted: false }
    });
    if (!tokenData) {
        throw new Error('Token not found');
    }
    return tokenData;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (user: { id: number }): Promise<AuthTokensResponse> => {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires, 'ACCESS');

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires, 'REFRESH');
    await saveToken(refreshToken, user.id, refreshTokenExpires, 'REFRESH');

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toISOString()
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toISOString()
        }
    };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = generateToken(user.id as number, expires, 'RESET_PASSWORD');
    await saveToken(resetPasswordToken, user.id as number, expires, 'RESET_PASSWORD');
    return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: { id: number }): Promise<string> => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = generateToken(user.id, expires, 'VERIFY_EMAIL');
    await saveToken(verifyEmailToken, user.id, expires, 'VERIFY_EMAIL');
    return verifyEmailToken;
};

export default {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken
};
