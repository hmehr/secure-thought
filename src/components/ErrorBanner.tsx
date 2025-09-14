/**
 * Error display components for handling API and application errors
 */

import { AlertTriangle, RefreshCw, Home, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
}

export function ErrorBanner({ 
  title = "Something went wrong",
  message, 
  onRetry, 
  onDismiss,
  variant = 'destructive',
  className 
}: ErrorBannerProps) {
  return (
    <Alert variant={variant} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDismiss}
            className="h-5 w-5 hover:bg-destructive-foreground/10"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function PageError({ 
  title = "Oops! Something went wrong",
  message = "We encountered an unexpected error. Please try again or return to the homepage.",
  onRetry,
  showHomeButton = true
}: PageErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/app'}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
      <XCircle className="h-4 w-4" />
      <span>{message}</span>
      {onRetry && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
          className="h-6 px-2 text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  );
}