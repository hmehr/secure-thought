import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Sparkles, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Editor } from '@/components/Editor';
import { PageLoader } from '@/components/Loader';
import { PageError } from '@/components/ErrorBanner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { withAuth, useAuth } from '@/lib/auth';
import { JournalAPI } from '@/lib/api';
import { JournalEntry, AISummary } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getAuthToken } = useAuth();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<AISummary | null>(null);

  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const journalAPI = useMemo(() => new JournalAPI(getAuthToken), [getAuthToken]);

  const loadEntry = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await journalAPI.getEntry(id);
      setEntry(data);
      setEditTitle(data.title);
      setEditBody(data.body);
    } catch (err: any) {
      console.error('Failed to load entry:', err);
      setError(err.message || 'Failed to load the journal entry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!id || !entry) return;

    setIsSaving(true);
    try {
      const updatedEntry = await journalAPI.updateEntry(id, {
        title: editTitle.trim() || 'Untitled',
        body: editBody.trim(),
      });

      setEntry(updatedEntry);
      setIsEditing(false);

      toast({
        title: 'Entry updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      console.error('Failed to update entry:', error);
      toast({
        title: 'Failed to save changes',
        description:
          error.message || 'There was an error updating your entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await journalAPI.deleteEntry(id);

      toast({
        title: 'Entry deleted',
        description: 'Your journal entry has been permanently deleted.',
      });

      navigate('/app');
    } catch (error: any) {
      console.error('Failed to delete entry:', error);
      toast({
        title: 'Failed to delete entry',
        description:
          error.message || 'There was an error deleting your entry. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const handleSummarize = async () => {
    if (!id) return;

    setIsSummarizing(true);
    try {
      const summaryData = await journalAPI.summarizeEntry(id); // returns AISummary
      setSummary(summaryData);

      toast({
        title: 'Summary generated',
        description: 'AI has analyzed your entry and created a summary.',
      });
    } catch (error: any) {
      console.error('Failed to summarize entry:', error);
      toast({
        title: 'Failed to generate summary',
        description:
          error.message || 'There was an error generating the AI summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCancelEdit = () => {
    if (!entry) return;

    setEditTitle(entry.title);
    setEditBody(entry.body);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <PageLoader message="Loading your journal entry..." />;
  }

  if (error || !entry) {
    return (
      <PageError
        title="Entry not found"
        message={
          error ||
          "The journal entry you're looking for doesn't exist or you don't have permission to view it."
        }
        onRetry={loadEntry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold truncate">
              {entry.title || 'Untitled Entry'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(entry.created_at)}</span>
              {entry.updated_at !== entry.created_at && (
                <>
                  <span>•</span>
                  <span>Updated {formatDate(entry.updated_at)}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">Edit</span>
              </Button>

              {entry.body.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {isSummarizing ? 'Summarizing...' : 'Summarize'}
                  </span>
                </Button>
              )}

              <ConfirmDialog
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline ml-2">Delete</span>
                  </Button>
                }
                title="Delete Entry"
                description="Are you sure you want to delete this journal entry? This action cannot be undone."
                confirmText="Delete Entry"
                onConfirm={handleDelete}
                isLoading={isDeleting}
              />
            </div>
          )}
        </div>

        {/* Entry Content */}
        <div className="space-y-6">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Edit Entry</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Editor
                  title={editTitle}
                  body={editBody}
                  onTitleChange={setEditTitle}
                  onBodyChange={setEditBody}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                {entry.body.trim() ? (
                  <div className="prose prose-sm max-w-none">
                    {entry.body.split('\n').map((line, index) => {
                      // Headers
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={index} className="text-lg font-semibold mt-6 mb-3 first:mt-0">
                            {line.slice(4)}
                          </h3>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={index} className="text-xl font-semibold mt-6 mb-3 first:mt-0">
                            {line.slice(3)}
                          </h2>
                        );
                      }
                      if (line.startsWith('# ')) {
                        return (
                          <h1 key={index} className="text-2xl font-bold mt-6 mb-3 first:mt-0">
                            {line.slice(2)}
                          </h1>
                        );
                      }

                      // Bold and italic
                      let processedLine = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(
                          /`(.*?)`/g,
                          '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>'
                        );

                      // Empty lines
                      if (line.trim() === '') {
                        return <br key={index} />;
                      }

                      // Regular paragraphs
                      return (
                        <p
                          key={index}
                          className="mb-4 leading-relaxed text-foreground"
                          dangerouslySetInnerHTML={{ __html: processedLine }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>This entry is empty.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="mt-4"
                    >
                      Add content
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  AI Summary
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated on {formatDate(summary.generated_at)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{summary.summary}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(EntryDetailPage);