import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required().description('PostgreSQL database URL'),

        // JWT Configuration
        JWT_ACCESS_SECRET: Joi.string().required().description('JWT access token secret key'),
        JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh token secret key'),
        JWT_ACCESS_EXPIRATION: Joi.string().default('15m').description('JWT access token expiration'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d').description('JWT refresh token expiration'),

        // Email Configuration
        SMTP_HOST: Joi.string().description('SMTP server host'),
        SMTP_PORT: Joi.number().default(587).description('SMTP server port'),
        SMTP_SECURE: Joi.boolean().default(false).description('SMTP secure connection'),
        SMTP_USER: Joi.string().description('SMTP username'),
        SMTP_PASS: Joi.string().description('SMTP password'),
        FROM_EMAIL: Joi.string().email().description('From email address'),

        // Search API Configuration
        SERP_API_KEY: Joi.string().description('SERP API key'),
        BING_SEARCH_API_KEY: Joi.string().description('Bing Search API key'),
        GOOGLE_SEARCH_API_KEY: Joi.string().description('Google Search API key'),
        GOOGLE_SEARCH_ENGINE_ID: Joi.string().description('Google Search Engine ID'),

        // Redis Configuration
        REDIS_URL: Joi.string().default('redis://localhost:6379').description('Redis connection URL'),
        REDIS_PASSWORD: Joi.string().allow('').description('Redis password'),

        // Security Configuration
        BCRYPT_ROUNDS: Joi.number().default(12).description('bcrypt salt rounds'),
        CORS_ORIGIN: Joi.string().default('http://localhost:3000').description('CORS origin'),

        // Rate Limiting
        RATE_LIMIT_WINDOW_MS: Joi.number()
            .default(15 * 60 * 1000)
            .description('Rate limit window in ms'),
        RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100).description('Max requests per window'),
        RATE_LIMIT_MAX_LOGIN_ATTEMPTS: Joi.number().default(5).description('Max login attempts'),

        // Other
        EMAIL_VERIFICATION_EXPIRATION: Joi.string().default('24h').description('Email verification expiration'),
        FRONTEND_URL: Joi.string().default('http://localhost:3000').description('Frontend URL'),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    database: {
        url: envVars.DATABASE_URL
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION
    },
    email: {
        smtp: {
            host: envVars.SMTP_HOST,
            port: envVars.SMTP_PORT,
            secure: envVars.SMTP_SECURE,
            auth: {
                user: envVars.SMTP_USER,
                pass: envVars.SMTP_PASS
            }
        },
        from: envVars.FROM_EMAIL
    },
    search: {
        serpApiKey: envVars.SERP_API_KEY,
        bingApiKey: envVars.BING_SEARCH_API_KEY,
        googleApiKey: envVars.GOOGLE_SEARCH_API_KEY,
        googleEngineId: envVars.GOOGLE_SEARCH_ENGINE_ID
    },
    redis: {
        url: envVars.REDIS_URL,
        password: envVars.REDIS_PASSWORD
    },
    security: {
        bcryptRounds: envVars.BCRYPT_ROUNDS,
        corsOrigin: envVars.CORS_ORIGIN
    },
    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
        maxLoginAttempts: envVars.RATE_LIMIT_MAX_LOGIN_ATTEMPTS
    },
    emailVerificationExpiration: envVars.EMAIL_VERIFICATION_EXPIRATION,
    frontendUrl: envVars.FRONTEND_URL,
    logLevel: envVars.LOG_LEVEL
};
