import { useState, useCallback, useEffect } from 'react';
import { BACKEND_URL } from '../lib/socket';

const API_BASE = `${BACKEND_URL}/api`;

export interface Session {
  id: string;
  started_at: number;
  ended_at: number | null;
  transcript_path: string | null;
  summary_high: string | null;
  summary_medium: string | null;
  summary_detailed: string | null;
  tmux_session: string | null;
  ssh_host: string | null;
}

export interface TranscriptData {
  id: string;
  startedAt: number;
  endedAt: number;
  lines: string[];
  rawText: string;
}

export interface SessionWithTranscript extends Session {
  transcript: TranscriptData | null;
}

export interface UseTranscriptsReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSession: (id: string) => Promise<SessionWithTranscript | null>;
  deleteSession: (id: string) => Promise<void>;
  summarizeSession: (id: string, level: 'high' | 'medium' | 'detailed') => Promise<string>;
}

export function useTranscripts(): UseTranscriptsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSession = useCallback(async (id: string): Promise<SessionWithTranscript | null> => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const summarizeSession = useCallback(
    async (id: string, level: 'high' | 'medium' | 'detailed'): Promise<string> => {
      const res = await fetch(`${API_BASE}/sessions/${id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) throw new Error('Summarization failed');
      const data = await res.json();

      // Update local state with new summary
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [`summary_${level}`]: data.summary } : s))
      );

      return data.summary;
    },
    []
  );

  return {
    sessions,
    loading,
    error,
    refresh,
    getSession,
    deleteSession,
    summarizeSession,
  };
}
