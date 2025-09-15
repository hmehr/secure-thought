// src/lib/auth.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Passage } from '@passageidentity/passage-js';

declare global {
  interface Window {
    Passage?: any; // provided by https://psg.so/web.js when using <passage-auth>
  }
}

type User = { id: string; email?: string | null } | null;

type AuthCtx = {
  user: User;
  isAuthenticated: boolean;
  loading: boolean;
  passage: any | null;
  getAuthToken: () => Promise<string | null>;
  signout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

// Env
const DEV_MODE = import.meta.env.VITE_DEV_AUTH === '1';
const APP_ID = import.meta.env.VITE_PASSAGE_APP_ID as string | undefined;
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/* --------------------------------- helpers -------------------------------- */

let cachedPassage: Passage | null = null;

async function getPassage(): Promise<Passage | null> {
  if (cachedPassage) return cachedPassage;
  if (!APP_ID) {
    console.error('[auth] Missing PASSAGE_APP_ID');
    return null;
  }

  try {
    cachedPassage = new Passage(APP_ID);
    console.log('[auth] Passage SDK initialized');
    return cachedPassage;
  } catch (err) {
    console.error('[auth] Failed to initialize Passage:', err);
    return null;
  }
}

/** Try all likely places where the token can be stored. */
function readTokenFromStorageAny(): string | null {
  try {
    // 1) exact key if we know APP_ID
    if (APP_ID) {
      const k = `psg_auth_token_${APP_ID}`;
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    // 2) any key that looks like a passage token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('psg_auth_token')) {
        const v = localStorage.getItem(key);
        if (v) return v;
      }
    }
  } catch {}
  // 3) cookie fallback (some older flows)
  try {
    const m = document.cookie.match(/(?:^|;\s*)psg_auth_token=([^;]+)/);
    if (m?.[1]) return decodeURIComponent(m[1]);
  } catch {}
  return null;
}

/* ------------------------------- provider ---------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState<Passage | null>(null);

  // Initialize Passage
  useEffect(() => {
    getPassage().then(p => setPassage(p));
  }, []);

  const getAuthToken = useCallback(async () => {
    try {
      // First try storage
      const storedToken = readTokenFromStorageAny();
      if (storedToken) {
        console.log('[auth] Using stored token');
        return storedToken;
      }

      // If no stored token, check Passage auth
      const p = await getPassage();
      if (!p) {
        console.log('[auth] No Passage instance available');
        return null;
      }

      try {
        const isAuthed = await p.isAuthenticated();
        console.log('[auth] Passage auth status:', isAuthed);
        
        if (isAuthed) {
          // Get new token using authToken() method
          const token = await p.authToken();
          if (token) {
            console.log('[auth] Got new token from Passage');
            return token;
          }
        }
      } catch (e) {
        console.error('[auth] Passage auth check failed:', e);
      }

      return null;
    } catch (err) {
      console.error('[auth] Token retrieval failed:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const token = await getAuthToken();
        console.log('[auth] Token check:', token ? 'present' : 'missing');
        
        if (!token) {
          if (mounted) {
            console.log('[auth] No token found, setting user to null');
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Validate token with backend
        console.log('[auth] Validating token with backend...');
        const resp = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!resp.ok) {
          console.error('[auth] Token validation failed:', resp.status);
          throw new Error('Invalid token');
        }

        const userData = await resp.json();
        console.log('[auth] User authenticated:', userData);
        if (mounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (err) {
        console.error('[auth] Auth check failed:', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Listen for Passage auth events
    const onAuthSuccess = () => checkAuth();
    document.addEventListener('passage-auth-success', onAuthSuccess);
    
    return () => {
      mounted = false;
      document.removeEventListener('passage-auth-success', onAuthSuccess);
    };
  }, [getAuthToken]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    passage, // Now we're passing the actual Passage instance
    getAuthToken,
    signout: async () => {
      try {
        if (passage) {
          await passage.signOut();
        }
        // Clear any stored tokens
        if (APP_ID) {
          localStorage.removeItem(`psg_auth_token_${APP_ID}`);
        }
      } catch (err) {
        console.error('[auth] Signout error:', err);
      }
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------- hook/guard -------------------------------- */

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function Guarded(props: T) {
    const { isAuthenticated, loading, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      console.log('[auth] Guard check:', { 
        isAuthenticated, 
        loading, 
        userId: user?.id 
      });
      
      if (!loading && !isAuthenticated) {
        console.log('[auth] Redirecting to login - no auth');
        navigate('/login', { 
          replace: true,
          state: { from: window.location.pathname }
        });
      }
    }, [loading, isAuthenticated, navigate, user]);

    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary rounded-full border-t-transparent" />
      </div>;
    }

    if (!isAuthenticated) return null;
    return <Component {...props} />;
  };
}