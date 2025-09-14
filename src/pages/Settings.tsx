/**
 * User settings and account management page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, LogOut, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '@/components/Header';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login');
      toast({
        title: "Signed out successfully",
        description: "You have been securely signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
      setIsSigningOut(false);
    }
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/app')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <h1 className="text-3xl font-heading font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </CardTitle>
              <CardDescription>
                Your account information and authentication details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1">
                  <h3 className="font-medium text-lg">
                    {user?.email || 'User Account'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Authenticated via passkey
                  </p>
                </div>
              </div>

              <Separator />

              {/* Account Details */}
              <div className="grid gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-3 w-3" />
                    Email
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {user?.email || 'Not available'}
                  </div>
                </div>

                {user?.created_at && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-3 w-3" />
                      Member since
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-3 w-3" />
                    Authentication
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    Passkey (WebAuthn)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
              <CardDescription>
                Your account is secured with passkey authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Passkey Protection</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your account is protected by passkey technology, which uses biometric authentication 
                      or hardware security keys. This provides stronger security than traditional passwords.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  To manage your passkeys or add new devices, use your device's built-in settings 
                  for passwords and passkeys.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h4 className="font-medium text-sm">Sign Out</h4>
                  <p className="text-xs text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                
                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/20">
                      <LogOut className="h-3 w-3 mr-2" />
                      Sign Out
                    </Button>
                  }
                  title="Sign Out"
                  description="Are you sure you want to sign out? You'll need to authenticate again to access your journal."
                  confirmText="Sign Out"
                  onConfirm={handleSignOut}
                  isLoading={isSigningOut}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground">
            Secure Journal • Powered by Passage
          </p>
        </div>
      </main>
    </div>
  );
}

export default withAuth(SettingsPage);