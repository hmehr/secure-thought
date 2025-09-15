/**
 * Loading state components for various UI contexts
 */

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';

interface LoaderProps {
  message?: string;
  className?: string;
}

export function Loader({ message = "Loading...", className }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function PageLoader({ message }: LoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader message={message} />
    </div>
  );
}

export function InlineLoader({ message, className }: LoaderProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

export function EntryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function EntriesListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <EntryCardSkeleton key={i} />
      ))}
    </div>
  );
}