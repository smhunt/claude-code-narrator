import type { TerminalSession } from '../hooks/useMultiTerminal';

interface SessionTabsProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onNewSession: () => void;
  onOpenSplitGuide?: () => void;
}

export function SessionTabs({
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
  onNewSession,
  onOpenSplitGuide,
}: SessionTabsProps) {
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

            {/* Label */}
            <span className="truncate max-w-[120px]">{session.label}</span>

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

      {/* Split View Guide button */}
      {onOpenSplitGuide && (
        <button
          onClick={onOpenSplitGuide}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-theme-tertiary text-theme-secondary hover:text-[var(--accent-primary)] transition-colors shrink-0 ml-auto"
          title="Split terminal setup guide"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </button>
      )}
    </div>
  );
}
