/**
 * Markdown editor component with preview toggle
 */

import { useState, useEffect } from 'react';
import { Eye, Edit3, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditorProps {
  title: string;
  body: string;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  placeholder?: string;
}

export function Editor({
  title,
  body,
  onTitleChange,
  onBodyChange,
  onSave,
  isSaving = false,
  placeholder = "Start writing your thoughts..."
}: EditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Simple markdown renderer for preview
  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
        }
        
        // Bold and italic
        let processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        // Regular paragraphs
        return (
          <p 
            key={index} 
            className="mb-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        );
      });
  };

  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Give your entry a title..."
          className="text-lg font-semibold"
          maxLength={200}
        />
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-3 w-3" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={onSave} 
            disabled={isSaving || (!title.trim() && !body.trim())}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <TabsContent value="edit" className="mt-4">
          <div className="space-y-2">
            <Label htmlFor="body" className="text-sm font-medium">
              Content
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[400px] font-mono text-sm leading-relaxed resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Supports basic Markdown: **bold**, *italic*, `code`, # headers
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card className="min-h-[400px]">
            <CardContent className="p-6">
              {body.trim() ? (
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(body)}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  <Eye className="h-8 w-8 mx-auto mb-4 opacity-50" />
                  <p>Nothing to preview yet.</p>
                  <p className="text-sm">Switch to the Write tab to start creating your entry.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center">
        <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd/Ctrl + S</kbd> to save
      </div>
    </div>
  );
}