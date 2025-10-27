import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query'
        },
        {
            emit: 'event',
            level: 'error'
        },
        {
            emit: 'event',
            level: 'info'
        },
        {
            emit: 'event',
            level: 'warn'
        }
    ]
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', e => {
        logger.debug('Database Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`
        });
    });
}

// Log database errors
prisma.$on('error', e => {
    logger.error('Database Error:', e);
});

// Log database info
prisma.$on('info', e => {
    logger.info('Database Info:', e.message);
});

// Log database warnings
prisma.$on('warn', e => {
    logger.warn('Database Warning:', e.message);
});

// Test database connection
export const connectDatabase = async (): Promise<void> => {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
    try {
        await prisma.$disconnect();
        logger.info('📡 Database disconnected successfully');
    } catch (error) {
        logger.error('❌ Error disconnecting from database:', error);
    }
};

export default prisma;
