/**
 * Main application header with navigation and user menu
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Plus, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export function Header() {
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
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link 
          to="/app" 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SJ</span>
          </div>
          <span className="font-heading font-semibold text-lg hidden sm:inline">
            Secure Journal
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-2">
          {/* New Entry Button */}
          <Button 
            asChild 
            size="sm" 
            className="hidden sm:inline-flex"
          >
            <Link to="/app/new">
              <Plus className="h-4 w-4" />
              New Entry
            </Link>
          </Button>

          {/* Mobile New Entry Button */}
          <Button 
            asChild 
            size="icon" 
            variant="ghost" 
            className="sm:hidden"
          >
            <Link to="/app/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Secure Journal Account
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* New Entry - Mobile Only */}
              <DropdownMenuItem asChild className="sm:hidden">
                <Link to="/app/new" className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New Entry</span>
                </Link>
              </DropdownMenuItem>
              
              {/* Settings */}
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Sign Out */}
              <DropdownMenuItem 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}