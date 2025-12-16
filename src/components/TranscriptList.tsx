import { useState } from 'react';
import type { Session } from '../hooks/useTranscripts';

type DetailLevel = 'high' | 'medium' | 'detailed';

interface TranscriptListProps {
  sessions: Session[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (session: Session) => void;
  onAutoPlay: (session: Session) => void;
  onPlaySummary: (session: Session, level: DetailLevel) => void;
  onViewTranscript: (session: Session) => void;
  onExportMarkdown: (session: Session) => void;
  onDelete: (id: string) => void;
  onReconnect?: (session: Session) => void;
  selectedId: string | null;
}

export function TranscriptList({
  sessions,
  loading,
  onRefresh,
  onSelect,
  onAutoPlay,
  onPlaySummary,
  onViewTranscript,
  onExportMarkdown,
  onDelete,
  onReconnect,
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

              {/* Tmux and SSH badges */}
              {(session.tmux_session || session.ssh_host) && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {session.ssh_host && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">
                      {session.ssh_host}
                    </span>
                  )}
                  {session.tmux_session && (
                    <span className="text-xs px-1.5 py-0.5 bg-emerald-900/50 text-emerald-300 rounded">
                      tmux:{session.tmux_session}
                    </span>
                  )}
                </div>
              )}

              {expandedId === session.id && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                  <div className="flex gap-1 flex-wrap">
                    {session.summary_high && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySummary(session, 'high');
                        }}
                        className="text-xs px-2 py-0.5 bg-green-800 hover:bg-green-700 rounded flex items-center gap-1 transition-colors"
                        title="Play brief summary"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Brief
                      </button>
                    )}
                    {session.summary_medium && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySummary(session, 'medium');
                        }}
                        className="text-xs px-2 py-0.5 bg-blue-800 hover:bg-blue-700 rounded flex items-center gap-1 transition-colors"
                        title="Play standard summary"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Standard
                      </button>
                    )}
                    {session.summary_detailed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySummary(session, 'detailed');
                        }}
                        className="text-xs px-2 py-0.5 bg-purple-800 hover:bg-purple-700 rounded flex items-center gap-1 transition-colors"
                        title="Play detailed summary"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Detailed
                      </button>
                    )}
                    {!session.summary_high && !session.summary_medium && !session.summary_detailed && (
                      <span className="text-xs text-gray-500">No summaries yet</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTranscript(session);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Transcript
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportMarkdown(session);
                        }}
                        className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                        title="Export as Markdown"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                      </button>
                      {session.tmux_session && onReconnect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReconnect(session);
                          }}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          title={`Reconnect to tmux:${session.tmux_session}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reconnect
                        </button>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
