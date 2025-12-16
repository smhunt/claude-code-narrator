import { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import type { TerminalSession } from '../hooks/useMultiTerminal';

interface MultiTerminalProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onMount: (tabId: string, container: HTMLDivElement) => void;
  onUnmount: (tabId: string) => void;
}

export function MultiTerminal({
  sessions,
  activeSessionId,
  onMount,
  onUnmount,
}: MultiTerminalProps) {
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Mount terminals when they become active
  useEffect(() => {
    sessions.forEach((session) => {
      const container = containerRefs.current.get(session.id);
      if (container && session.id === activeSessionId && !session.terminal) {
        onMount(session.id, container);
      }
    });
  }, [sessions, activeSessionId, onMount]);

  // Handle unmount on cleanup
  useEffect(() => {
    return () => {
      sessions.forEach((session) => {
        if (session.terminal) {
          onUnmount(session.id);
        }
      });
    };
  }, [sessions, onUnmount]);

  // Force fit when switching tabs - only depends on activeSessionId
  // The fit is also handled by setActiveSession, but this ensures
  // fit happens after any layout changes from tab switching
  const lastActiveIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeSessionId && activeSessionId !== lastActiveIdRef.current) {
      lastActiveIdRef.current = activeSessionId;
      const session = sessions.find(s => s.id === activeSessionId);
      if (session?.fitAddon && session?.containerRef) {
        // Delay fit to allow layout to settle
        setTimeout(() => {
          try {
            session.fitAddon?.fit();
            session.terminal?.focus();
          } catch (e) {
            // Ignore errors
          }
        }, 100);
      }
    }
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (sessions.length === 0) {
    return (
      <div className="h-full bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center">
        <div className="text-center text-theme-secondary">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No terminal sessions</p>
          <p className="text-xs text-theme-muted mt-1">Click + to create a new terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-full bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-700 p-2">
      <div className="relative h-full w-full overflow-hidden">
        {sessions.map((session) => (
          <div
            key={session.id}
            ref={(el) => {
              if (el) {
                containerRefs.current.set(session.id, el);
              } else {
                containerRefs.current.delete(session.id);
              }
            }}
            className={`absolute inset-0 overflow-hidden ${
              session.id === activeSessionId ? 'visible' : 'invisible'
            }`}
            style={{ zIndex: session.id === activeSessionId ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}
