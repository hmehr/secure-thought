import { useEffect, useState } from "react";
import { useJournalApi } from '@/lib/client';

type Entry = {
  id: string;
  title: string;
  body: string;
  ai_summary?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export default function Index() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const api = useJournalApi();
        const data = await api.getEntries();
        setEntries(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load entries");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Entries</h1>
        <a
          href="/new"
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          New Entry
        </a>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground">
          No entries yet — create your first thought.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded border p-3">
              <a
                className="block"
                href={`/entry/${e.id}`}
                title="Open entry"
              >
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {e.body}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}