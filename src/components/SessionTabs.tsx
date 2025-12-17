import { useState, useRef, useEffect } from 'react';
import type { TerminalSession } from '../hooks/useMultiTerminal';
import type { SplitDirection } from '../hooks/useSplitLayout';

interface SessionTabsProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onRenameSession: (id: string, newLabel: string) => void;
  onNewSession: () => void;
  onOpenSplitGuide?: () => void;
  // Split controls
  isSplit?: boolean;
  splitDirection?: SplitDirection;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onExitSplit?: () => void;
  onSwapPanes?: () => void;
}

export function SessionTabs({
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
  onRenameSession,
  onNewSession,
  onOpenSplitGuide,
  isSplit = false,
  splitDirection,
  onSplitHorizontal,
  onSplitVertical,
  onExitSplit,
  onSwapPanes,
}: SessionTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (session: TerminalSession) => {
    setEditingId(session.id);
    setEditValue(session.label);
  };

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim()) {
      onRenameSession(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-theme-secondary border-b border-theme">
        <button
          onClick={onNewSession}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-theme-secondary border-b border-theme overflow-x-auto">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const typeIcon = session.sessionType === 'ssh' ? (
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ) : session.sessionType === 'local' ? (
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );

        return (
          <div
            key={session.id}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-t text-sm cursor-pointer transition-colors min-w-0 ${
              isActive
                ? 'bg-[var(--terminal-bg)] text-theme-primary border-t border-x border-theme -mb-px'
                : 'bg-theme-tertiary/50 text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
            }`}
            onClick={() => onSelectSession(session.id)}
            onDoubleClick={() => handleDoubleClick(session)}
            title="Double-click to rename"
          >
            {/* Connection status dot */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                session.isConnected
                  ? 'bg-green-500'
                  : session.sessionType
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
              }`}
            />

            {/* Type icon */}
            {typeIcon}

            {/* Label - editable */}
            {editingId === session.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameSubmit(session.id)}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
                onClick={(e) => e.stopPropagation()}
                className="bg-theme-tertiary text-theme-primary px-1 py-0 text-sm rounded border border-[var(--accent-primary)] outline-none w-24"
              />
            ) : (
              <span className="truncate max-w-[120px]">{session.label}</span>
            )}

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseSession(session.id);
              }}
              className={`p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0 ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Close tab"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* New Tab button */}
      <button
        onClick={onNewSession}
        className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors shrink-0"
        title="New terminal tab"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Split Controls */}
      <div className="flex items-center gap-1 ml-auto border-l border-theme pl-2">
        {!isSplit ? (
          <>
            {/* Split Horizontal */}
            {onSplitHorizontal && sessions.length >= 1 && (
              <button
                onClick={onSplitHorizontal}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-[var(--accent-primary)] transition-colors shrink-0"
                title="Split view horizontally (side by side)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
              </button>
            )}
            {/* Split Vertical */}
            {onSplitVertical && sessions.length >= 1 && (
              <button
                onClick={onSplitVertical}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-[var(--accent-primary)] transition-colors shrink-0"
                title="Split view vertically (stacked)"
              >
                <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <>
            {/* Swap Panes */}
            {onSwapPanes && (
              <button
                onClick={onSwapPanes}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-[var(--accent-primary)] transition-colors shrink-0"
                title="Swap panes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            )}
            {/* Toggle Direction */}
            {onSplitHorizontal && onSplitVertical && (
              <button
                onClick={splitDirection === 'horizontal' ? onSplitVertical : onSplitHorizontal}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-[var(--accent-primary)] transition-colors shrink-0"
                title={splitDirection === 'horizontal' ? 'Switch to vertical split' : 'Switch to horizontal split'}
              >
                <svg className={`w-4 h-4 ${splitDirection === 'vertical' ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
            {/* Exit Split */}
            {onExitSplit && (
              <button
                onClick={onExitSplit}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-500/20 text-theme-secondary hover:text-red-400 transition-colors shrink-0"
                title="Exit split view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Split View Guide button */}
        {onOpenSplitGuide && (
          <button
            onClick={onOpenSplitGuide}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-theme-muted transition-colors shrink-0"
            title="Split terminal setup guide (external)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
