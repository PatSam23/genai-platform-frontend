import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, RegisterRequest } from '@/types/auth'; // Importing types
import { apiClient } from '@/lib/apiClient';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  actions: {
    login: (credentials: LoginRequest) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    checkAuth: () => Promise<void>;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      actions: {
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          try {
            // Clear any stale auth error from previous attempts
            set({ error: null });
            // Updated endpoint to use FormData format for OAuth2PasswordRequestForm compliance
            const formData = new FormData();
            formData.append('username', credentials.username);
            formData.append('password', credentials.password);
            
            const response = await apiClient.post('/auth/login', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { access_token, refresh_token } = response.data;
            
            // Store tokens in state & localStorage (via persist + manual for apiClient)
            set({
              accessToken: access_token,
              refreshToken: refresh_token,
              isAuthenticated: true,
              user: { id: 0, email: credentials.username, is_active: true } // Mock user for now until /me endpoint exists
            });

            // Sync with apiClient logic (localStorage used there)
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

          } catch (error: any) {
            let message = 'Login failed';
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    message = detail;
                } else if (Array.isArray(detail)) {
                    // Extract first validation error message
                    message = detail[0]?.msg || JSON.stringify(detail);
                } else if (typeof detail === 'object') {
                    message = JSON.stringify(detail);
                }
            }
            set({ error: message, isAuthenticated: false });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        register: async (userData) => {
          set({ isLoading: true, error: null });
          try {
            await apiClient.post('/auth/register', userData);
            // Auto login after register? Or redirect? usually redirect to login
          } catch (error: any) {
             let message = 'Registration failed';
              if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    message = detail;
                } else if (Array.isArray(detail)) {
                    message = detail[0]?.msg || JSON.stringify(detail);
                } else if (typeof detail === 'object') {
                    message = JSON.stringify(detail);
                }
              }
             set({ error: message });
             throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        logout: () => {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          if (typeof window !== 'undefined') {
             window.location.href = '/login';
          }
        },

        setTokens: (accessToken, refreshToken) => {
          set({ accessToken, refreshToken, isAuthenticated: !!accessToken });
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        },
        
        checkAuth: async () => {
           const token = localStorage.getItem('access_token');
           if (token) {
             try {
               // Decode the JWT payload and check expiration
               const payload = JSON.parse(atob(token.split('.')[1]));
               if (payload.exp && payload.exp * 1000 < Date.now()) {
                 // Token expired — clear everything
                 get().actions.logout();
                 return;
               }
               set({ isAuthenticated: true, accessToken: token });
             } catch {
               // Malformed token — treat as unauthenticated
               get().actions.logout();
             }
           } else {
             set({ isAuthenticated: false, user: null });
           }
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ accessToken: state.accessToken, refreshToken: state.refreshToken, user: state.user, isAuthenticated: state.isAuthenticated }), // Persist specific fields
    }
  )
);
// Hook to access actions easily
export const useAuthActions = () => useAuthStore((state) => state.actions);
