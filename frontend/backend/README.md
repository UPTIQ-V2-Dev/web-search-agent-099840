# Web Search Agent Backend

A comprehensive Node.js/Express backend API for the Web Search Agent application, providing authentication, user management, and web search functionality with history tracking.

## Features

- 🔐 **Authentication System**: JWT-based auth with access/refresh tokens, bcrypt password hashing, email verification
- 👥 **User Management**: Full CRUD operations, role-based access control (USER/ADMIN)
- 🔍 **Web Search**: Multi-provider search integration (SERP API, Bing Search)
- 📊 **Search History**: Complete tracking and analytics of user searches
- 🏪 **Caching**: Redis-powered result caching for improved performance
- 🛡️ **Security**: Rate limiting, input validation, CORS, security headers
- 📚 **API Documentation**: Interactive Swagger/OpenAPI documentation
- 🐳 **Docker Support**: Complete containerization with Docker Compose
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 📝 **Logging**: Structured logging with Winston

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis 7
- **Authentication**: JWT
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for containerized deployment)

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### 4. Start Development Server

```bash
# Start in development mode
npm run dev
```

The API will be available at `http://localhost:3001`

## Docker Deployment

### Development

```bash
# Start all services in development mode
docker-compose --profile development up -d

# Run migrations
docker-compose --profile migrate up migrate

# Seed database
docker-compose --profile seed up seed
```

### Production

```bash
# Start all services in production mode
docker-compose --profile production up -d

# Run migrations
docker-compose --profile migrate up migrate
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/verify-email/:token` - Verify email
- `GET /api/v1/auth/profile` - Get user profile
- `GET /api/v1/auth/check` - Check auth status

### User Management (Admin Only)

- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/users/stats` - User statistics

### Search

- `POST /api/v1/search/web` - Perform web search
- `GET /api/v1/search/suggestions` - Get search suggestions
- `GET /api/v1/search/stats` - Search statistics (Admin)
- `DELETE /api/v1/search/cache/clear` - Clear expired cache (Admin)

### Search History

- `GET /api/v1/search/history` - Get search history
- `POST /api/v1/search/history` - Save search to history
- `DELETE /api/v1/search/history` - Clear all history
- `DELETE /api/v1/search/history/:id` - Delete history item
- `GET /api/v1/search/history/stats` - History statistics

## Environment Variables

### Required

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
```

### Optional

```bash
NODE_ENV=development
PORT=3001
REDIS_URL="redis://localhost:6379"
CORS_ORIGIN="http://localhost:3000"

# Search API Keys (configure at least one)
SERP_API_KEY="your_serp_api_key"
BING_SEARCH_API_KEY="your_bing_api_key"
GOOGLE_SEARCH_API_KEY="your_google_api_key"
GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourapp.com"
```

## Scripts

```bash
# Development
npm run dev              # Start development server
npm run build:watch      # Build in watch mode

# Production
npm run build            # Build for production
npm start               # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:migrate:prod # Run migrations in production
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Testing & Quality
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues

# Documentation
npm run docs            # Generate API documentation
```

## API Documentation

Interactive Swagger documentation is available at:

- Development: `http://localhost:3001/api/docs`
- JSON Schema: `http://localhost:3001/api/docs.json`

## Security Features

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Rate Limiting**: Configurable per-endpoint limits
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js integration
- **CORS**: Configurable cross-origin policies
- **Password Security**: bcrypt hashing with salt rounds

## Performance Features

- **Caching**: Redis-powered search result caching
- **Compression**: Gzip compression for responses
- **Connection Pooling**: Prisma connection management
- **Query Optimization**: Efficient database queries
- **Response Pagination**: Large dataset handling

## Monitoring & Logging

- **Health Checks**: `/health` endpoint for monitoring
- **Structured Logging**: Winston with multiple transports
- **Error Tracking**: Comprehensive error handling
- **Metrics**: Performance and usage statistics

## Default Users

After seeding, these users are available:

- **Admin**: admin@websearchagent.com / admin123
- **User**: user@example.com / user123

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- GitHub Issues: [Create an issue]
- Email: support@websearchagent.com
- Documentation: [API Docs](http://localhost:3001/api/docs)
