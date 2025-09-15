/**
 * Main dashboard page showing journal entries list
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Search, Plus, BookOpen, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { EntryCard } from '@/components/EntryCard';
import { Loader, EntriesListSkeleton } from '@/components/Loader';
import { ErrorBanner } from '@/components/ErrorBanner';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { JournalAPI } from '@/lib/api';
import { JournalEntry } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

function AppDashboardComponent() {
  const { getAuthToken } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('AppDashboard rendering:', { loading, error, entriesCount: entries.length });

  const journalAPI = useMemo(() => new JournalAPI(getAuthToken), [getAuthToken]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await journalAPI.getEntries();
      setEntries(data);
    } catch (err: any) {
      console.error('Failed to load entries:', err);
      setError(err.message || 'Failed to load your journal entries');
      toast({
        title: "Error loading entries",
        description: "There was a problem loading your journal entries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter(entry => 
      entry.title.toLowerCase().includes(query) ||
      entry.body.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  // Sort entries by creation date (newest first)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredEntries]);

  const EmptyState = () => (
    <div className="text-center py-16 space-y-6">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-heading font-semibold">No entries yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Start your journaling journey by creating your first entry. 
          Capture your thoughts, ideas, and memories in a secure space.
        </p>
      </div>
      
      <Button asChild size="lg" className="mt-6">
        <Link to="/app/new">
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Entry
        </Link>
      </Button>
    </div>
  );

  const NoSearchResults = () => (
    <div className="text-center py-12 space-y-4">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-heading font-semibold">No results found</h3>
        <p className="text-muted-foreground">
          No entries match your search for "{searchQuery}". Try different keywords.
        </p>
      </div>
      
      <Button 
        variant="outline" 
        onClick={() => setSearchQuery('')}
      >
        Clear Search
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">Your Journal</h1>
            <p className="text-muted-foreground">
              {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'No entries yet'}
            </p>
          </div>
          
          <Button asChild size="lg" className="self-start sm:self-auto">
            <Link to="/app/new">
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        {entries.length > 0 && (
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <EntriesListSkeleton />
        ) : error ? (
          <ErrorBanner 
            message={error}
            onRetry={loadEntries}
          />
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : filteredEntries.length === 0 ? (
          <NoSearchResults />
        ) : (
          <div className="space-y-4">
            {sortedEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        <Outlet /> {/* This will render the nested routes */}
      </main>
    </div>
  );
}

export const AppDashboard = withAuth(AppDashboardComponent);
export default AppDashboard;