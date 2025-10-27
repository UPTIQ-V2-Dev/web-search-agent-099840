import app from './app';
import { config } from '@/config';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import logger from '@/config/logger';
import cron from 'node-cron';
import { SearchService } from '@/services/searchService';

const searchService = new SearchService();

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
        logger.info('HTTP server closed');
    });

    // Close database connection
    await disconnectDatabase();

    logger.info('Graceful shutdown completed');
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();

        // Start HTTP server
        const server = app.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
            logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
            logger.info(`🔍 Health Check: http://localhost:${config.port}/health`);
        });

        // Set up scheduled tasks
        setupCronJobs();

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Set up cron jobs for maintenance tasks
const setupCronJobs = () => {
    // Clear expired cache every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const deletedCount = await searchService.clearExpiredCache();
            logger.info(`Cron job: Cleared ${deletedCount} expired cache entries`);
        } catch (error) {
            logger.error('Cron job error - clearing expired cache:', error);
        }
    });

    // Clean up old tokens every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            const deletedTokens = await prisma.token.deleteMany({
                where: {
                    OR: [{ expires: { lt: new Date() } }, { blacklisted: true }]
                }
            });

            await prisma.$disconnect();

            logger.info(`Cron job: Cleaned up ${deletedTokens.count} expired/blacklisted tokens`);
        } catch (error) {
            logger.error('Cron job error - cleaning up tokens:', error);
        }
    });

    logger.info('📅 Cron jobs scheduled successfully');
};

// Create server instance
const server = startServer();

export default server;
