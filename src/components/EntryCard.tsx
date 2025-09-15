/**
 * Card component for displaying journal entries in list view
 */

import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { JournalEntry } from '@/lib/types';

interface EntryCardProps {
  entry: JournalEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    // Avoid negative “-1 days” when the ISO timestamp is slightly ahead of local time.
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) {
      // Same local day: show time
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    // Fallback to a concise calendar date (year only if different from this year)
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getPreview = (body: string, maxLength: number = 150) => {
    if (body.length <= maxLength) return body;

    // Find the last complete word within the limit
    const truncated = body.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  return (
    <Link to={`/app/${entry.id}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-focus:outline-none group-focus:ring-2 group-focus:ring-ring group-focus:ring-offset-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-heading font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {entry.title || 'Untitled Entry'}
            </h3>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1.5" />
            <span>{formatDate(entry.created_at)}</span>
          </div>
        </CardHeader>

        {entry.body && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {getPreview(entry.body)}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}