/**
 * Login page using Passage authentication (or Dev bypass)
 * Works with VITE_DEV_AUTH=1 (dev) and Passage mode (VITE_DEV_AUTH=0 + VITE_PASSAGE_APP_ID)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Loader } from '@/components/Loader';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Shield, Fingerprint, Smartphone } from 'lucide-react';

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const DEV_MODE = import.meta.env.VITE_DEV_AUTH === '1';
  const PASSAGE_APP_ID = import.meta.env.VITE_PASSAGE_APP_ID as string | undefined;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Listen for Passage auth events (Passage mode) or the demo button (Dev mode)
    const handleAuthSuccess = () => navigate('/app');
    const handleAuthError = (error: any) => {
      console.error('Authentication error:', error);
      setAuthError(error?.detail?.message || 'Authentication failed. Please try again.');
    };
    document.addEventListener('passage-auth-success', handleAuthSuccess as any);
    document.addEventListener('passage-auth-error', handleAuthError as any);
    return () => {
      document.removeEventListener('passage-auth-success', handleAuthSuccess as any);
      document.removeEventListener('passage-auth-error', handleAuthError as any);
    };
  }, [navigate]);

  if (loading) {
    return <Loader message="Initializing secure authentication..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold">Welcome to Secure Journal</h1>
          <p className="text-muted-foreground">
            Sign in securely with your passkey — no passwords required
          </p>
        </div>

        {/* Authentication Card */}
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Use your fingerprint, face, or security key to access your journal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError && (
              <ErrorBanner
                message={authError}
                onDismiss={() => setAuthError(null)}
                className="mb-6"
              />
            )}

            <div className="passage-auth-container space-y-4">
              {DEV_MODE ? (
                // ---------- Dev mode: demo sign-in ----------
                <div className="text-center p-8 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Dev Mode is ON — click below to simulate passkey authentication
                  </p>
                  <Button
                    onClick={() => {
                      const event = new CustomEvent('passage-auth-success', {
                        detail: { user: { id: 'dev-user', email: 'demo@example.com' } },
                      });
                      document.dispatchEvent(event);
                    }}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Sign In with Demo Passkey
                  </Button>
                </div>
              ) : PASSAGE_APP_ID ? (
                // ---------- Passage mode: real passkey UI ----------
                <div className="p-2">
                  {/* @ts-ignore - web component registered by @passageidentity/passage-elements */}
                  <passage-auth app-id={PASSAGE_APP_ID}></passage-auth>
                </div>
              ) : (
                // ---------- Misconfiguration ----------
                <ErrorBanner
                  title="Configuration Error"
                  message='Missing VITE_PASSAGE_APP_ID. Set it in your frontend .env or enable dev mode with VITE_DEV_AUTH=1.'
                />
              )}

              {!DEV_MODE && (
                <div className="text-xs text-center text-muted-foreground">
                  Powered by <code className="bg-muted px-1 rounded">Passage</code> passkeys
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Fingerprint className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Biometric</h3>
              <p className="text-xs text-muted-foreground">Fingerprint &amp; Face ID</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Device</h3>
              <p className="text-xs text-muted-foreground">Phone &amp; Computer</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Hardware</h3>
              <p className="text-xs text-muted-foreground">Security Keys</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Powered by passkey technology for maximum security
          </p>
        </div>
      </div>
    </div>
  );
}