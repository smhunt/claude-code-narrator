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
  onDeleteSession: (id: string) => void;
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
  onDeleteSession,
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

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-theme-primary border-l border-theme shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme bg-theme-secondary">
          <h2 className="text-lg font-semibold text-theme-primary">History & Narration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-tertiary rounded-lg transition-colors text-theme-secondary hover:text-theme-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)] overflow-hidden">
          {/* Narration Panel - at top for quick access */}
          <div className="p-4 border-b border-theme bg-theme-secondary/50">
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
          <div className="flex-1 overflow-y-auto p-4">
            <TranscriptList
              sessions={sessions}
              loading={sessionsLoading}
              onRefresh={onRefreshSessions}
              onSelect={onSelectSession}
              onAutoPlay={onAutoPlay}
              onPlaySummary={onPlaySummary}
              onViewTranscript={onViewTranscript}
              onDelete={onDeleteSession}
              selectedId={selectedSessionId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
