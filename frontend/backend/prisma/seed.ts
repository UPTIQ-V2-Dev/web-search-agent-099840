import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@websearchagent.com' },
        update: {},
        create: {
            email: 'admin@websearchagent.com',
            password: adminPassword,
            name: 'System Administrator',
            role: UserRole.ADMIN,
            isEmailVerified: true
        }
    });

    console.log('✅ Admin user created:', admin.email);

    // Create test user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            password: userPassword,
            name: 'Test User',
            role: UserRole.USER,
            isEmailVerified: true
        }
    });

    console.log('✅ Test user created:', user.email);

    // Create sample search history for test user
    const sampleSearches = [
        {
            query: 'web development tutorials',
            resultCount: 15,
            searchedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
            query: 'react best practices',
            resultCount: 23,
            searchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
            query: 'nodejs express tutorial',
            resultCount: 18,
            searchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
            query: 'typescript advanced features',
            resultCount: 12,
            searchedAt: new Date()
        }
    ];

    for (const search of sampleSearches) {
        await prisma.searchHistory.create({
            data: {
                ...search,
                userId: user.id
            }
        });
    }

    console.log('✅ Sample search history created');

    // Create system settings
    const systemSettings = [
        {
            key: 'search_cache_duration',
            value: { hours: 24 }
        },
        {
            key: 'max_search_results_per_page',
            value: { count: 50 }
        },
        {
            key: 'search_rate_limit',
            value: { requests_per_minute: 60 }
        },
        {
            key: 'email_verification_required',
            value: { enabled: true }
        }
    ];

    for (const setting of systemSettings) {
        await prisma.systemSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting
        });
    }

    console.log('✅ System settings created');

    console.log('🎉 Database seeding completed successfully!');
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
