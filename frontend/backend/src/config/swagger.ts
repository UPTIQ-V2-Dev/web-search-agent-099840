import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { config } from '@/config';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Web Search Agent API',
            version: '1.0.0',
            description:
                'A comprehensive REST API for the Web Search Agent application, providing authentication, user management, and web search functionality with history tracking.',
            contact: {
                name: 'Web Search Agent Team',
                email: 'support@websearchagent.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/v1`,
                description: 'Development server'
            },
            {
                url: `https://api.websearchagent.com/api/v1`,
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    required: ['success', 'message'],
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        },
                        code: {
                            type: 'string',
                            example: 'ERROR_CODE'
                        },
                        details: {
                            type: 'object',
                            description: 'Additional error details'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        role: {
                            type: 'string',
                            enum: ['USER', 'ADMIN'],
                            example: 'USER'
                        },
                        isEmailVerified: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        lastLoginAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true
                        }
                    }
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        access: {
                            type: 'object',
                            properties: {
                                token: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                expires: {
                                    type: 'string',
                                    format: 'date-time'
                                }
                            }
                        },
                        refresh: {
                            type: 'object',
                            properties: {
                                token: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                expires: {
                                    type: 'string',
                                    format: 'date-time'
                                }
                            }
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        user: {
                            $ref: '#/components/schemas/User'
                        },
                        tokens: {
                            $ref: '#/components/schemas/AuthTokens'
                        }
                    }
                },
                SearchResult: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'result_123'
                        },
                        title: {
                            type: 'string',
                            example: 'Example Search Result'
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/page'
                        },
                        snippet: {
                            type: 'string',
                            example: 'This is a snippet of the search result...'
                        },
                        domain: {
                            type: 'string',
                            example: 'example.com'
                        },
                        publishedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        contentType: {
                            type: 'string',
                            enum: ['web', 'images', 'videos', 'news'],
                            example: 'web'
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                author: {
                                    type: 'string'
                                },
                                wordCount: {
                                    type: 'integer'
                                },
                                imageUrl: {
                                    type: 'string',
                                    format: 'uri'
                                },
                                videoLength: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                },
                SearchResponse: {
                    type: 'object',
                    properties: {
                        results: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/SearchResult'
                            }
                        },
                        totalCount: {
                            type: 'integer',
                            example: 1000
                        },
                        searchTime: {
                            type: 'integer',
                            description: 'Search time in milliseconds',
                            example: 250
                        },
                        currentPage: {
                            type: 'integer',
                            example: 1
                        },
                        totalPages: {
                            type: 'integer',
                            example: 100
                        },
                        hasNextPage: {
                            type: 'boolean',
                            example: true
                        },
                        suggestions: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['related query 1', 'related query 2']
                        }
                    }
                },
                SearchHistoryItem: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        query: {
                            type: 'string',
                            example: 'web development tutorials'
                        },
                        filters: {
                            type: 'object',
                            nullable: true
                        },
                        searchedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        resultCount: {
                            type: 'integer',
                            example: 15
                        }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        results: {
                            type: 'array',
                            items: {}
                        },
                        page: {
                            type: 'integer',
                            example: 1
                        },
                        limit: {
                            type: 'integer',
                            example: 10
                        },
                        totalPages: {
                            type: 'integer',
                            example: 5
                        },
                        totalResults: {
                            type: 'integer',
                            example: 50
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication information is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Access denied. No token provided.',
                                code: 'NO_TOKEN'
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Access forbidden',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Insufficient permissions',
                                code: 'INSUFFICIENT_PERMISSIONS'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/Error' },
                                    {
                                        type: 'object',
                                        properties: {
                                            errors: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        field: {
                                                            type: 'string'
                                                        },
                                                        message: {
                                                            type: 'string'
                                                        },
                                                        value: {}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                RateLimitError: {
                    description: 'Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Too many requests, please try again later',
                                code: 'RATE_LIMIT_EXCEEDED'
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization'
            },
            {
                name: 'User Management',
                description: 'User CRUD operations and profile management'
            },
            {
                name: 'Search',
                description: 'Web search functionality'
            },
            {
                name: 'Search History',
                description: 'Search history management'
            }
        ]
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
    // Swagger UI options
    const swaggerOptions = {
        explorer: true,
        swaggerOptions: {
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
            tryItOutEnabled: true,
            persistAuthorization: true
        },
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2563eb }
      .swagger-ui .scheme-container { 
        background: #f8fafc; 
        border: 1px solid #e2e8f0; 
        border-radius: 6px; 
        padding: 10px; 
        margin: 10px 0; 
      }
    `,
        customSiteTitle: 'Web Search Agent API Documentation',
        customfavIcon: '/favicon.ico'
    };

    // Serve swagger docs
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

    // Serve swagger JSON
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};

export { specs };
export default { setupSwagger };
