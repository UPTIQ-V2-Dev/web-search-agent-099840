# API Specification

## Database Models

```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  name            String?
  password        String
  role            String   @default("USER")
  isEmailVerified Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tokens          Token[]
}

model Token {
  id          Int       @id @default(autoincrement())
  token       String
  type        String
  expires     DateTime
  blacklisted Boolean
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
  userId      Int
}

model SearchHistory {
  id          String      @id @default(uuid())
  userId      Int
  query       String
  filters     String?
  resultCount Int
  searchTime  Float
  createdAt   DateTime    @default(now())
  user        User        @relation(fields: [userId], references: [id])
}

model SearchCache {
  id         String   @id @default(uuid())
  cacheKey   String   @unique
  results    String
  hitCount   Int      @default(1)
  expiresAt  DateTime
  createdAt  DateTime @default(now())
}
```

---

## Authentication Endpoints

### EP: POST /auth/register
DESC: Register a new user account.
IN: body:{name:str!, email:str!, password:str!}
OUT: 201:{user:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}, tokens:{access:{token:str, expires:str}, refresh:{token:str, expires:str}}}
ERR: {"400":"Invalid input or email already exists", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/register -H "Content-Type: application/json" -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
EX_RES_201: {"user":{"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":false,"createdAt":"2025-01-15T10:30:00Z","updatedAt":"2025-01-15T10:30:00Z"},"tokens":{"access":{"token":"eyJhbGciOiJIUzI1NiIs...","expires":"2025-01-15T11:30:00Z"},"refresh":{"token":"eyJhbGciOiJIUzI1NiIs...","expires":"2025-01-22T10:30:00Z"}}}

---

### EP: POST /auth/login
DESC: Login with email and password.
IN: body:{email:str!, password:str!}
OUT: 200:{user:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}, tokens:{access:{token:str, expires:str}, refresh:{token:str, expires:str}}}
ERR: {"401":"Invalid email or password", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/login -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"password123"}'
EX_RES_200: {"user":{"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":false,"createdAt":"2025-01-15T10:30:00Z","updatedAt":"2025-01-15T10:30:00Z"},"tokens":{"access":{"token":"eyJhbGciOiJIUzI1NiIs...","expires":"2025-01-15T11:30:00Z"},"refresh":{"token":"eyJhbGciOiJIUzI1NiIs...","expires":"2025-01-22T10:30:00Z"}}}

---

### EP: POST /auth/logout
DESC: Logout and invalidate refresh token.
IN: body:{refreshToken:str!}
OUT: 204:{}
ERR: {"404":"Refresh token not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIs..."}'
EX_RES_204: {}

---

### EP: POST /auth/refresh-tokens
DESC: Refresh access and refresh tokens.
IN: body:{refreshToken:str!}
OUT: 200:{access:{token:str, expires:str}, refresh:{token:str, expires:str}}
ERR: {"401":"Invalid or expired refresh token", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/refresh-tokens -H "Content-Type: application/json" -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIs..."}'
EX_RES_200: {"access":{"token":"eyJhbGciOiJIUzI1NiIs...","expires":"2025-01-15T11:30:00Z"},"refresh":{"token":"eyJhbGciOiJIUzI1NiIs...","expires":"2025-01-22T10:30:00Z"}}

---

### EP: POST /auth/forgot-password
DESC: Send password reset email.
IN: body:{email:str!}
OUT: 204:{}
ERR: {"404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/forgot-password -H "Content-Type: application/json" -d '{"email":"john@example.com"}'
EX_RES_204: {}

---

### EP: POST /auth/reset-password
DESC: Reset password using reset token.
IN: query:{token:str!}, body:{password:str!}
OUT: 204:{}
ERR: {"401":"Invalid or expired token", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/reset-password?token=reset_token123 -H "Content-Type: application/json" -d '{"password":"newpassword123"}'
EX_RES_204: {}

---

### EP: POST /auth/send-verification-email
DESC: Send email verification email to authenticated user.
IN: headers:{Authorization:str!}
OUT: 204:{}
ERR: {"401":"Authentication required", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/send-verification-email -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
EX_RES_204: {}

---

### EP: POST /auth/verify-email
DESC: Verify email address using verification token.
IN: query:{token:str!}
OUT: 204:{}
ERR: {"401":"Invalid or expired token", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/verify-email?token=verify_token123
EX_RES_204: {}

---

## User Management Endpoints

### EP: POST /users
DESC: Create a new user (admin only).
IN: headers:{Authorization:str!}, body:{name:str!, email:str!, password:str!, role:str!}
OUT: 201:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input or email already exists", "401":"Authentication required", "403":"Insufficient permissions", "500":"Internal server error"}
EX_REQ: curl -X POST /users -H "Authorization: Bearer admin_token" -H "Content-Type: application/json" -d '{"name":"Jane Smith","email":"jane@example.com","password":"password123","role":"USER"}'
EX_RES_201: {"id":2,"email":"jane@example.com","name":"Jane Smith","role":"USER","isEmailVerified":false,"createdAt":"2025-01-15T10:35:00Z","updatedAt":"2025-01-15T10:35:00Z"}

---

### EP: GET /users
DESC: Get all users with pagination and filtering (admin only).
IN: headers:{Authorization:str!}, query:{name:str, role:str, sortBy:str, limit:int, page:int}
OUT: 200:{results:arr[obj], page:int, limit:int, totalPages:int, totalResults:int}
ERR: {"401":"Authentication required", "403":"Insufficient permissions", "500":"Internal server error"}
EX_REQ: curl -X GET /users?page=1&limit=10&role=USER -H "Authorization: Bearer admin_token"
EX_RES_200: {"results":[{"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":false,"createdAt":"2025-01-15T10:30:00Z","updatedAt":"2025-01-15T10:30:00Z"}],"page":1,"limit":10,"totalPages":1,"totalResults":1}

---

### EP: GET /users/{userId}
DESC: Get a specific user by ID.
IN: headers:{Authorization:str!}, params:{userId:int!}
OUT: 200:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"401":"Authentication required", "403":"Insufficient permissions", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X GET /users/1 -H "Authorization: Bearer token"
EX_RES_200: {"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":false,"createdAt":"2025-01-15T10:30:00Z","updatedAt":"2025-01-15T10:30:00Z"}

---

### EP: PATCH /users/{userId}
DESC: Update user information.
IN: headers:{Authorization:str!}, params:{userId:int!}, body:{name:str, email:str, password:str}
OUT: 200:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input or email already exists", "401":"Authentication required", "403":"Insufficient permissions", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X PATCH /users/1 -H "Authorization: Bearer token" -H "Content-Type: application/json" -d '{"name":"John Updated"}'
EX_RES_200: {"id":1,"email":"john@example.com","name":"John Updated","role":"USER","isEmailVerified":false,"createdAt":"2025-01-15T10:30:00Z","updatedAt":"2025-01-15T11:00:00Z"}

---

### EP: DELETE /users/{userId}
DESC: Delete a user account.
IN: headers:{Authorization:str!}, params:{userId:int!}
OUT: 200:{}
ERR: {"401":"Authentication required", "403":"Insufficient permissions", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /users/1 -H "Authorization: Bearer token"
EX_RES_200: {}

---

## Search Endpoints

### EP: POST /search/web
DESC: Perform web search with filters and pagination.
IN: headers:{Authorization:str!}, body:{query:str!, page:int, limit:int, filters:{contentType:str, sortBy:str, domain:str, dateRange:{from:str, to:str}}}
OUT: 200:{results:arr[obj], totalCount:int, searchTime:float, currentPage:int, totalPages:int, hasNextPage:bool, suggestions:arr[str]}
ERR: {"400":"Invalid search query or parameters", "401":"Authentication required", "429":"Rate limit exceeded", "500":"Internal server error"}
EX_REQ: curl -X POST /search/web -H "Authorization: Bearer token" -H "Content-Type: application/json" -d '{"query":"web development","page":1,"limit":10,"filters":{"contentType":"web","sortBy":"relevance"}}'
EX_RES_200: {"results":[{"id":"1","title":"Web Development Guide","url":"https://example.com/guide","snippet":"Complete guide to web development","domain":"example.com","publishedAt":"2025-01-10T10:00:00Z","contentType":"web","metadata":{"author":"John Smith","wordCount":2000}}],"totalCount":15,"searchTime":0.234,"currentPage":1,"totalPages":2,"hasNextPage":true,"suggestions":["web development tools","web development frameworks"]}

---

### EP: GET /search/suggestions
DESC: Get search suggestions based on query.
IN: headers:{Authorization:str!}, query:{q:str!}
OUT: 200:arr[str]
ERR: {"400":"Invalid query parameter", "401":"Authentication required", "429":"Rate limit exceeded", "500":"Internal server error"}
EX_REQ: curl -X GET /search/suggestions?q=web -H "Authorization: Bearer token"
EX_RES_200: ["web development","web design","web security","web frameworks","web optimization"]

---

### EP: GET /search/history
DESC: Get user's search history with pagination and filtering.
IN: headers:{Authorization:str!}, query:{page:int, limit:int, searchTerm:str, fromDate:str, toDate:str}
OUT: 200:{items:arr[obj], totalCount:int, currentPage:int, totalPages:int, hasNextPage:bool}
ERR: {"401":"Authentication required", "500":"Internal server error"}
EX_REQ: curl -X GET /search/history?page=1&limit=10 -H "Authorization: Bearer token"
EX_RES_200: {"items":[{"id":"uuid-123","query":"web development","filters":{"contentType":"web","sortBy":"relevance"},"searchedAt":"2025-01-15T10:30:00Z","resultCount":15}],"totalCount":5,"currentPage":1,"totalPages":1,"hasNextPage":false}

---

### EP: POST /search/history
DESC: Save search query to user's history.
IN: headers:{Authorization:str!}, body:{query:str!, resultCount:int!, filters:obj}
OUT: 201:{id:str, query:str, filters:obj, searchedAt:str, resultCount:int}
ERR: {"400":"Invalid input parameters", "401":"Authentication required", "500":"Internal server error"}
EX_REQ: curl -X POST /search/history -H "Authorization: Bearer token" -H "Content-Type: application/json" -d '{"query":"web development","resultCount":15,"filters":{"contentType":"web"}}'
EX_RES_201: {"id":"uuid-456","query":"web development","filters":{"contentType":"web"},"searchedAt":"2025-01-15T10:35:00Z","resultCount":15}

---

### EP: DELETE /search/history
DESC: Clear all search history for authenticated user.
IN: headers:{Authorization:str!}
OUT: 204:{}
ERR: {"401":"Authentication required", "500":"Internal server error"}
EX_REQ: curl -X DELETE /search/history -H "Authorization: Bearer token"
EX_RES_204: {}

---

### EP: DELETE /search/history/{id}
DESC: Delete specific search history item.
IN: headers:{Authorization:str!}, params:{id:str!}
OUT: 204:{}
ERR: {"401":"Authentication required", "404":"Search history item not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /search/history/uuid-123 -H "Authorization: Bearer token"
EX_RES_204: {}

---

### EP: GET /search/history/stats
DESC: Get user's search statistics.
IN: headers:{Authorization:str!}
OUT: 200:{totalSearches:int, uniqueQueries:int, averageResultCount:float, mostSearchedQuery:str, searchFrequency:obj}
ERR: {"401":"Authentication required", "500":"Internal server error"}
EX_REQ: curl -X GET /search/history/stats -H "Authorization: Bearer token"
EX_RES_200: {"totalSearches":50,"uniqueQueries":35,"averageResultCount":12.5,"mostSearchedQuery":"web development","searchFrequency":{"today":5,"thisWeek":15,"thisMonth":50}}

---

### EP: GET /search/stats
DESC: Get system-wide search statistics (admin only).
IN: headers:{Authorization:str!}
OUT: 200:{totalSearches:int, uniqueQueries:int, averageSearchTime:float, cacheHitRate:float, popularQueries:arr[obj]}
ERR: {"401":"Authentication required", "403":"Insufficient permissions", "500":"Internal server error"}
EX_REQ: curl -X GET /search/stats -H "Authorization: Bearer admin_token"
EX_RES_200: {"totalSearches":1000,"uniqueQueries":750,"averageSearchTime":0.345,"cacheHitRate":0.65,"popularQueries":[{"query":"web development","count":50},{"query":"javascript","count":45}]}

---

### EP: DELETE /search/cache/clear
DESC: Clear expired cache entries (admin only).
IN: headers:{Authorization:str!}
OUT: 200:{clearedEntries:int, message:str}
ERR: {"401":"Authentication required", "403":"Insufficient permissions", "500":"Internal server error"}
EX_REQ: curl -X DELETE /search/cache/clear -H "Authorization: Bearer admin_token"
EX_RES_200: {"clearedEntries":25,"message":"Expired cache entries cleared successfully"}

---

## MCP (Model Context Protocol) Endpoints

### EP: POST /mcp
DESC: Initialize MCP session or execute MCP tools.
IN: headers:{mcp-session-id:str}, body:{method:str!, params:obj, id:str}
OUT: 200:{jsonrpc:str, result:obj, id:str}
ERR: {"400":"Invalid JSON-RPC request", "401":"Authentication required", "500":"Internal server error"}
EX_REQ: curl -X POST /mcp -H "mcp-session-id: uuid-session" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"user_get_all","params":{"page":1,"limit":10},"id":"1"}'
EX_RES_200: {"jsonrpc":"2.0","result":{"users":[{"id":1,"email":"john@example.com","name":"John Doe","role":"USER"}],"pagination":{"page":1,"limit":10,"total":1}},"id":"1"}

---

### EP: GET /mcp
DESC: Handle GET requests for MCP sessions.
IN: headers:{mcp-session-id:str!}
OUT: 200:{sessionId:str, status:str, capabilities:arr[str]}
ERR: {"400":"Missing session ID", "404":"Session not found", "500":"Internal server error"}
EX_REQ: curl -X GET /mcp -H "mcp-session-id: uuid-session"
EX_RES_200: {"sessionId":"uuid-session","status":"active","capabilities":["user_create","user_get_all","user_get_by_id","user_update","user_delete"]}

---

### EP: DELETE /mcp
DESC: Clean up and terminate MCP session.
IN: headers:{mcp-session-id:str!}
OUT: 204:{}
ERR: {"400":"Missing session ID", "404":"Session not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /mcp -H "mcp-session-id: uuid-session"
EX_RES_204: {}