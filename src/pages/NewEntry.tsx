/**
 * New entry creation page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Editor } from '@/components/Editor';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { JournalAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

function NewEntryPage() {
  const { getAuthToken } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const journalAPI = new JournalAPI(getAuthToken);

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) {
      toast({
        title: "Entry is empty",
        description: "Please add a title or content before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const entry = await journalAPI.createEntry({
        title: title.trim() || 'Untitled',
        body: body.trim()
      });

      toast({
        title: "Entry created",
        description: "Your journal entry has been saved successfully.",
      });

      navigate(`/app/${entry.id}`);
    } catch (error: any) {
      console.error('Failed to create entry:', error);
      toast({
        title: "Failed to save entry",
        description: error.message || "There was an error creating your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (title.trim() || body.trim()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/app');
      }
    } else {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleGoBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <h1 className="text-3xl font-heading font-bold">New Entry</h1>
            <p className="text-muted-foreground">
              Create a new journal entry
            </p>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-card rounded-lg border p-6">
          <Editor
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onSave={handleSave}
            isSaving={isSaving}
            placeholder="What's on your mind today? Start writing your thoughts, ideas, or experiences..."
          />
        </div>

        {/* Auto-save info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Your entry will be saved when you click the Save button or press Cmd/Ctrl + S
          </p>
        </div>
      </main>
    </div>
  );
}

export default withAuth(NewEntryPage);