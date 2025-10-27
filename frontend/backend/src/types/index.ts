import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export interface TokenPayload {
    sub: number;
    iat: number;
    exp: number;
    type: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: Omit<User, 'password'>;
    tokens: {
        access: {
            token: string;
            expires: Date;
        };
        refresh: {
            token: string;
            expires: Date;
        };
    };
}

export interface SearchFilters {
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    domain?: string;
    contentType?: 'all' | 'web' | 'images' | 'videos' | 'news';
    sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface SearchQuery {
    query: string;
    filters?: SearchFilters;
    page?: number;
    limit?: number;
}

export interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    publishedAt: string;
    contentType: 'web' | 'images' | 'videos' | 'news';
    metadata?: {
        author?: string;
        wordCount?: number;
        imageUrl?: string;
        videoLength?: string;
    };
}

export interface SearchResponse {
    results: SearchResult[];
    totalCount: number;
    searchTime: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    suggestions?: string[];
}

export interface PaginatedResponse<T> {
    results: T[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
}

export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
}
