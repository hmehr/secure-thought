/**
 * Login page using Passage authentication
 * Handles passkey sign-up and sign-in
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
  const { isAuthenticated, loading, passage } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Listen for Passage auth events
    const handleAuthSuccess = () => {
      navigate('/app');
    };

    const handleAuthError = (error: any) => {
      console.error('Authentication error:', error);
      setAuthError(error?.detail?.message || 'Authentication failed. Please try again.');
    };

    // Add event listeners for passage auth
    document.addEventListener('passage-auth-success', handleAuthSuccess);
    document.addEventListener('passage-auth-error', handleAuthError);

    return () => {
      document.removeEventListener('passage-auth-success', handleAuthSuccess);
      document.removeEventListener('passage-auth-error', handleAuthError);
    };
  }, [navigate]);

  if (loading) {
    return <Loader message="Initializing secure authentication..." />;
  }

  if (!passage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorBanner 
          title="Configuration Error"
          message="Authentication service is not properly configured. Please check your environment variables."
        />
      </div>
    );
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
            Sign in securely with your passkey - no passwords required
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
              <div className="text-center p-8 border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Demo Mode: Click below to simulate passkey authentication
                </p>
                <Button 
                  onClick={() => {
                    // Simulate successful authentication
                    const event = new CustomEvent('passage-auth-success', {
                      detail: { user: { id: 'demo_user', email: 'demo@example.com' } }
                    });
                    document.dispatchEvent(event);
                  }}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Sign In with Demo Passkey
                </Button>
              </div>
              
              <div className="text-xs text-center text-muted-foreground">
                In production, this would be replaced with:
                <br />
                <code className="bg-muted px-1 rounded">&lt;passage-auth app-id="your_app_id"&gt;&lt;/passage-auth&gt;</code>
              </div>
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
              <p className="text-xs text-muted-foreground">Fingerprint & Face ID</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Device</h3>
              <p className="text-xs text-muted-foreground">Phone & Computer</p>
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