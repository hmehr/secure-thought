import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = { id: string } | null;
type Ctx = {
  user: User; isAuthenticated: boolean; loading: boolean;
  getAuthToken: () => Promise<string>; signOut: () => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

const DEV = import.meta.env.VITE_DEV_AUTH === '1';
const APP_ID = import.meta.env.VITE_PASSAGE_APP_ID as string | undefined;

let passageInstance: any = null;
async function initPassage() {
  if (passageInstance) return passageInstance;
  if (!APP_ID) throw new Error('VITE_PASSAGE_APP_ID required');
  const js: any = await import('@passageidentity/passage-js');
  await import('@passageidentity/passage-elements');
  const PassageCtor = js?.default ?? js?.Passage ?? js;
  passageInstance = new PassageCtor(APP_ID);
  return passageInstance;
}
async function getPassageToken() {
  const p = await initPassage();
  const t = await p.getAuthToken();
  if (!t) throw new Error('No Passage token');
  return t;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (DEV) { setUser({ id: 'dev-user' }); return; }
        const p = await initPassage();
        const t = await p.getAuthToken();
        setUser(t ? { id: 'passage-user' } : null);
        const onOk = () => alive && setUser({ id: 'passage-user' });
        document.addEventListener('passage-auth-success', onOk as any);
        return () => document.removeEventListener('passage-auth-success', onOk as any);
      } catch { setUser(null); }
      finally { setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const getAuthToken = async () => (DEV ? 'user:demo' : getPassageToken());
  const signOut = async () => { setUser(null); };

  const value = useMemo<Ctx>(() => ({
    user, isAuthenticated: !!user, loading, getAuthToken, signOut
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
// add to the bottom of src/lib/auth.tsx, after useAuth()
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function Guarded(props: T) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return <div className="p-8 text-center">Loading…</div>;
    }

    if (!isAuthenticated) {
      // In Passage mode this sends users to the login page with <passage-auth>.
      // In dev mode (VITE_DEV_AUTH=1) you're auto-signed-in so this won't trigger.
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
}