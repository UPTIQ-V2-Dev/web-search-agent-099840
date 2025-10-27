import type { PaginatedResponse } from '@/types/api';
import type { AuthResponse, User } from '@/types/user';
import type { SearchResponse, SearchResult, SearchHistoryItem } from '@/types/search';
import type { SearchHistoryResponse } from '@/types/history';

export const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    name: 'John Doe',
    role: 'USER',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const mockAdminUser: User = {
    id: 2,
    email: 'admin@example.com',
    name: 'Jane Smith',
    role: 'ADMIN',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const mockUsers: User[] = [mockUser, mockAdminUser];

export const mockAuthResponse: AuthResponse = {
    user: mockUser,
    tokens: {
        access: {
            token: 'mock-access-token',
            expires: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        },
        refresh: {
            token: 'mock-refresh-token',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    }
};

export const mockPaginatedUsers: PaginatedResponse<User> = {
    results: mockUsers,
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 2
};

export const mockSearchResults: SearchResult[] = [
    {
        id: '1',
        title: 'Understanding Web Search Algorithms',
        url: 'https://example.com/search-algorithms',
        snippet:
            'Learn how modern search engines work and the algorithms that power them. This comprehensive guide covers indexing, ranking, and retrieval techniques.',
        domain: 'example.com',
        publishedAt: '2024-01-15T10:30:00Z',
        contentType: 'web',
        metadata: {
            author: 'Jane Smith',
            wordCount: 1500
        }
    },
    {
        id: '2',
        title: 'AI-Powered Search: The Future is Here',
        url: 'https://techblog.com/ai-search',
        snippet:
            'Explore how artificial intelligence is revolutionizing search technology. From natural language processing to semantic understanding.',
        domain: 'techblog.com',
        publishedAt: '2024-01-10T14:20:00Z',
        contentType: 'web',
        metadata: {
            author: 'John Doe',
            wordCount: 2200
        }
    },
    {
        id: '3',
        title: 'Building Search Agents with Modern JavaScript',
        url: 'https://devnews.com/search-agents',
        snippet:
            'A practical guide to creating intelligent search agents using React, Node.js, and machine learning APIs.',
        domain: 'devnews.com',
        publishedAt: '2024-01-08T09:15:00Z',
        contentType: 'web',
        metadata: {
            author: 'Sarah Johnson',
            wordCount: 1800
        }
    },
    {
        id: '4',
        title: 'Search Engine Optimization Best Practices',
        url: 'https://seoguide.com/best-practices',
        snippet:
            'Master the art of SEO with proven strategies and techniques. Learn how to optimize your content for better search visibility.',
        domain: 'seoguide.com',
        publishedAt: '2024-01-05T16:45:00Z',
        contentType: 'web',
        metadata: {
            author: 'Mike Wilson',
            wordCount: 3000
        }
    },
    {
        id: '5',
        title: 'The Evolution of Search Technology',
        url: 'https://history.com/search-evolution',
        snippet:
            'From simple keyword matching to complex neural networks, discover how search technology has evolved over the decades.',
        domain: 'history.com',
        publishedAt: '2024-01-03T11:30:00Z',
        contentType: 'web',
        metadata: {
            author: 'Lisa Chen',
            wordCount: 2500
        }
    }
];

export const mockSearchResponse: SearchResponse = {
    results: mockSearchResults,
    totalCount: 15,
    searchTime: 0.045,
    currentPage: 1,
    totalPages: 3,
    hasNextPage: true,
    suggestions: ['web search', 'search algorithms', 'AI search']
};

export const mockSearchHistory: SearchHistoryItem[] = [
    {
        id: '1',
        query: 'web search algorithms',
        filters: {
            contentType: 'web',
            sortBy: 'relevance'
        },
        searchedAt: '2024-01-15T14:30:00Z',
        resultCount: 15
    },
    {
        id: '2',
        query: 'AI search technology',
        filters: {
            contentType: 'all',
            sortBy: 'date'
        },
        searchedAt: '2024-01-14T10:20:00Z',
        resultCount: 23
    },
    {
        id: '3',
        query: 'React search components',
        filters: {
            contentType: 'web',
            domain: 'github.com'
        },
        searchedAt: '2024-01-13T16:45:00Z',
        resultCount: 8
    }
];

export const mockSearchHistoryResponse: SearchHistoryResponse = {
    items: mockSearchHistory,
    totalCount: 3,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false
};
