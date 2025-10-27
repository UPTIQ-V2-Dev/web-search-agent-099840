import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { setupSwagger } from '@/config/swagger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import searchRoutes from '@/routes/searchRoutes';
import logger from '@/config/logger';

const app: Application = express();

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

// CORS configuration
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow configured origins
        const allowedOrigins = config.security.corsOrigin.split(',').map(o => o.trim());

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }

        // In development, allow localhost with any port
        if (config.env === 'development' && origin.includes('localhost')) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Compression
app.use(compression());

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later',
            code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
        });
    }
});

app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.env !== 'test') {
    const morganFormat = config.env === 'production' ? 'combined' : 'dev';
    app.use(
        morgan(morganFormat, {
            stream: {
                write: (message: string) => logger.info(message.trim())
            }
        })
    );
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: config.env,
            version: '1.0.0'
        }
    });
});

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Web Search Agent API',
        data: {
            version: '1.0.0',
            environment: config.env,
            documentation: '/api/docs',
            health: '/health'
        }
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;
