import jwt from 'jsonwebtoken';
import { TokenType } from '@prisma/client';
import { config } from '@/config';
import { TokenPayload } from '@/types';

export const generateToken = (
    userId: number,
    expires: Date,
    type: TokenType,
    secret = config.jwt.accessSecret
): string => {
    const payload: TokenPayload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expires.getTime() / 1000),
        type
    };
    return jwt.sign(payload, secret);
};

export const verifyToken = (token: string, secret = config.jwt.accessSecret): TokenPayload => {
    try {
        return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

export const generateAuthTokens = async (userId: number) => {
    const accessTokenExpires = new Date();
    accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + 15); // 15 minutes

    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 days

    const accessToken = generateToken(userId, accessTokenExpires, TokenType.ACCESS, config.jwt.accessSecret);

    const refreshToken = generateToken(userId, refreshTokenExpires, TokenType.REFRESH, config.jwt.refreshSecret);

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires
        }
    };
};

export const generateEmailVerificationToken = (userId: number): string => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours

    return generateToken(userId, expires, TokenType.EMAIL_VERIFICATION);
};

export const generatePasswordResetToken = (userId: number): string => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour

    return generateToken(userId, expires, TokenType.PASSWORD_RESET);
};
