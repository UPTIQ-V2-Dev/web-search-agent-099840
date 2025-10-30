import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin',
            password: adminPassword,
            role: 'ADMIN',
            isEmailVerified: true
        }
    });

    console.log('✅ Created admin user:', admin.email);

    // Create regular test user
    const userPassword = await bcrypt.hash('user123', 12);
    const testUser = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            name: 'Test User',
            password: userPassword,
            role: 'USER',
            isEmailVerified: true
        }
    });

    console.log('✅ Created test user:', testUser.email);

    // Create sample search history
    await prisma.searchHistory.upsert({
        where: { id: 'sample-search-1' },
        update: {},
        create: {
            id: 'sample-search-1',
            userId: testUser.id,
            query: 'web development',
            filters: JSON.stringify({ contentType: 'web', sortBy: 'relevance' }),
            resultCount: 15,
            searchTime: 0.234
        }
    });

    await prisma.searchHistory.upsert({
        where: { id: 'sample-search-2' },
        update: {},
        create: {
            id: 'sample-search-2',
            userId: testUser.id,
            query: 'javascript tutorials',
            filters: JSON.stringify({ contentType: 'web', sortBy: 'date' }),
            resultCount: 22,
            searchTime: 0.145
        }
    });

    console.log('✅ Created sample search history entries');

    // Create sample search cache
    const cacheResults = JSON.stringify({
        results: [
            {
                id: '1',
                title: 'Web Development Guide',
                url: 'https://example.com/guide',
                snippet: 'Complete guide to web development...',
                domain: 'example.com',
                publishedAt: new Date().toISOString(),
                contentType: 'web',
                metadata: { author: 'John Smith', wordCount: 2000 }
            }
        ],
        totalCount: 15,
        searchTime: 0.234
    });

    await prisma.searchCache.upsert({
        where: { cacheKey: 'search:web development:{"contentType":"web","sortBy":"relevance"}:1:10' },
        update: {},
        create: {
            cacheKey: 'search:web development:{"contentType":"web","sortBy":"relevance"}:1:10',
            results: cacheResults,
            hitCount: 3,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        }
    });

    console.log('✅ Created sample search cache entry');
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
