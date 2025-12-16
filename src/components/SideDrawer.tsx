import { useEffect } from 'react';
import { TranscriptList } from './TranscriptList';
import { NarrationPanel } from './NarrationPanel';
import type { Session } from '../hooks/useTranscripts';

type DetailLevel = 'high' | 'medium' | 'detailed';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // History
  sessions: Session[];
  sessionsLoading: boolean;
  onRefreshSessions: () => void;
  onSelectSession: (session: Session) => void;
  onAutoPlay: (session: Session) => void;
  onPlaySummary: (session: Session, level: DetailLevel) => void;
  onViewTranscript: (session: Session) => void;
  onExportMarkdown: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onReconnect?: (session: Session) => void;
  selectedSessionId: string | null;
  // Narration
  summary: string | null;
  summaryLevel: string | null;
  isSpeaking: boolean;
  isPaused: boolean;
  onSpeak: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function SideDrawer({
  isOpen,
  onClose,
  sessions,
  sessionsLoading,
  onRefreshSessions,
  onSelectSession,
  onAutoPlay,
  onPlaySummary,
  onViewTranscript,
  onExportMarkdown,
  onDeleteSession,
  onReconnect,
  selectedSessionId,
  summary,
  summaryLevel,
  isSpeaking,
  isPaused,
  onSpeak,
  onStop,
  onPause,
  onResume,
}: SideDrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // No backdrop blocking - drawer is inline
  if (!isOpen) return null;

  return (
    <div className="w-80 min-w-[280px] max-w-sm h-full bg-theme-primary border-l border-theme flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-theme bg-theme-secondary shrink-0">
        <h2 className="text-sm font-semibold text-theme-primary">History</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-theme-tertiary rounded transition-colors text-theme-secondary hover:text-theme-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - scrollable on mobile */}
      <div className="flex flex-col flex-1 overflow-y-auto sm:overflow-hidden">
        {/* Narration Panel - scrollable section with max height */}
        <div className="p-3 border-b border-theme bg-theme-secondary/50 max-h-[60vh] sm:max-h-[50%] overflow-y-auto">
          <NarrationPanel
            summary={summary}
            summaryLevel={summaryLevel}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onSpeak={onSpeak}
            onStop={onStop}
            onPause={onPause}
            onResume={onResume}
          />
        </div>

        {/* History List - scrollable */}
        <div className="flex-1 min-h-[200px] overflow-y-auto p-3">
          <TranscriptList
            sessions={sessions}
            loading={sessionsLoading}
            onRefresh={onRefreshSessions}
            onSelect={onSelectSession}
            onAutoPlay={onAutoPlay}
            onPlaySummary={onPlaySummary}
            onViewTranscript={onViewTranscript}
            onExportMarkdown={onExportMarkdown}
            onDelete={onDeleteSession}
            onReconnect={onReconnect}
            selectedId={selectedSessionId}
          />
        </div>
      </div>
    </div>
  );
}
