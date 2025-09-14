/**
 * Authentication provider using Passage by 1Password
 * Handles passkey authentication and JWT token management
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  getAuthToken: () => Promise<string>;
  signOut: () => Promise<void>;
  passage: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState<any | null>(null);

  useEffect(() => {
    const initPassage = async () => {
      try {
        const appId = import.meta.env.VITE_PASSAGE_APP_ID;
        if (!appId) {
          console.error('VITE_PASSAGE_APP_ID environment variable is required');
          setLoading(false);
          return;
        }

        // Create a simple passage-like object for now
        // In production, you would integrate with the actual Passage SDK
        const passageInstance = {
          appId,
          async getCurrentUser() {
            // Check if there's a stored session
            const token = localStorage.getItem('passage_token');
            if (token) {
              try {
                // In a real app, you'd validate the token with your backend
                return { id: 'user_123', email: 'user@example.com' };
              } catch {
                localStorage.removeItem('passage_token');
                return null;
              }
            }
            return null;
          },
          async getAuthToken() {
            const token = localStorage.getItem('passage_token');
            if (!token) {
              throw new Error('No auth token available');
            }
            return token;
          },
          async signOut() {
            localStorage.removeItem('passage_token');
            return Promise.resolve();
          }
        };

        setPassage(passageInstance);

        // Check if user is already authenticated
        try {
          const currentUser = await passageInstance.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // User not authenticated yet
          setUser(null);
        }

        // Listen for Passage auth events
        const handleAuthSuccess = (event: any) => {
          // Mock successful authentication
          const mockUser = { id: 'user_123', email: 'user@example.com' };
          const mockToken = 'mock_jwt_token_' + Date.now();
          
          localStorage.setItem('passage_token', mockToken);
          setUser(mockUser);
        };

        document.addEventListener('passage-auth-success', handleAuthSuccess);

        return () => {
          document.removeEventListener('passage-auth-success', handleAuthSuccess);
        };
      } catch (error) {
        console.error('Failed to initialize Passage:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initPassage();
  }, []);

  const getAuthToken = async (): Promise<string> => {
    if (!passage) {
      throw new Error('Passage not initialized');
    }

    try {
      const token = await passage.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  };

  const signOut = async (): Promise<void> => {
    if (!passage) return;

    try {
      await passage.signOut();
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    getAuthToken,
    signOut,
    passage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * HOC to protect routes that require authentication
 */
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
}