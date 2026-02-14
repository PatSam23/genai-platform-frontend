// Frontend-specific Auth and API types

// User Model
export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

// Token Response
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Login Request
export interface LoginRequest {
  username: string; // formData uses 'username' for OAuth2 compliance, but it's email
  password: string;
}

// Registration Request
export interface RegisterRequest {
  email: string;
  password: string;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refresh_token: string;
}

// Error Interface
export interface ApiError {
  detail: string;
}
