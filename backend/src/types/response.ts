export interface TokenResponse {
    token: string;
    expires: string;
}

export interface AuthTokensResponse {
    access: TokenResponse;
    refresh?: TokenResponse;
}

export interface UserResponse {
    id: number;
    email: string;
    name: string | null;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: UserResponse;
    tokens: AuthTokensResponse;
}
