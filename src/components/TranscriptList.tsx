import { useState } from 'react';
import type { Session } from '../hooks/useTranscripts';

interface TranscriptListProps {
  sessions: Session[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (session: Session) => void;
  onAutoPlay: (session: Session) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

export function TranscriptList({
  sessions,
  loading,
  onRefresh,
  onSelect,
  onAutoPlay,
  onDelete,
  selectedId,
}: TranscriptListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: number, end: number | null) => {
    if (!end) return 'In progress';
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">History</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            No recorded sessions yet.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`bg-gray-900 rounded-lg p-3 cursor-pointer transition-colors ${
                selectedId === session.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-850'
              }`}
              onClick={() => onSelect(session)}
              onDoubleClick={() => onAutoPlay(session)}
              title="Double-click to play"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-white truncate flex-1">
                  {session.id.slice(0, 8)}...
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDuration(session.started_at, session.ended_at)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expandedId === session.id ? null : session.id);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedId === session.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {formatDate(session.started_at)}
              </div>

              {expandedId === session.id && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                  <div className="flex gap-1">
                    {session.summary_high && (
                      <span className="text-xs px-2 py-0.5 bg-green-800 rounded">Brief</span>
                    )}
                    {session.summary_medium && (
                      <span className="text-xs px-2 py-0.5 bg-blue-800 rounded">Standard</span>
                    )}
                    {session.summary_detailed && (
                      <span className="text-xs px-2 py-0.5 bg-purple-800 rounded">Detailed</span>
                    )}
                    {!session.summary_high && !session.summary_medium && !session.summary_detailed && (
                      <span className="text-xs text-gray-500">No summaries yet</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id);
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete session
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
