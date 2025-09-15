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
  signOut: () => Promise<void>;
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
    const stored = readTokenFromStorageAny();
    if (stored) return stored;

    try {
      const g: any = (window as any).Passage;
      if (g && typeof g.getAuthToken === 'function') {
        const t = await g.getAuthToken();
        if (t) return t;
      }
    } catch (e) {
      console.warn('[auth] window.Passage.getAuthToken fallback failed:', e);
    }

    return null;
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

const value: AuthCtx = {
  user,
  isAuthenticated: !!user,
  loading,
  passage,
  getAuthToken,
  signOut: async () => {
    try {
      const p = passage ?? (await getPassage());

      
      if (p && typeof (p as any).signOut === 'function') {
        await (p as any).signOut();
      } else if (p?.session && typeof (p.session as any).signOut === 'function') {
        await (p.session as any).signOut();
      }    
      if (APP_ID) {
        localStorage.removeItem(`psg_auth_token_${APP_ID}`);
      }
      document.cookie = 'psg_auth_token=; Max-Age=0; path=/;';
      document.cookie = 'psg_user=; Max-Age=0; path=/;';
    } catch (err) {
      console.error('[auth] Signout error:', err);
    }   
    setUser(null);
    window.location.replace('/login');
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