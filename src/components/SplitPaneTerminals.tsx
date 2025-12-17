import { useEffect, useRef, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import '@xterm/xterm/css/xterm.css';
import type { TerminalSession } from '../hooks/useMultiTerminal';
import type { SplitLayoutState } from '../hooks/useSplitLayout';

interface SplitPaneTerminalsProps {
  sessions: TerminalSession[];
  layout: SplitLayoutState;
  onMount: (tabId: string, container: HTMLDivElement) => void;
  onUnmount: (tabId: string) => void;
  onFocusPane: (pane: 'primary' | 'secondary') => void;
  onSizesChange: (sizes: [number, number]) => void;
  onSelectTerminalForPane: (pane: 'primary' | 'secondary', terminalId: string) => void;
}

interface TerminalPaneProps {
  session: TerminalSession | undefined;
  sessions: TerminalSession[];
  isFocused: boolean;
  onMount: (tabId: string, container: HTMLDivElement) => void;
  onFocus: () => void;
  onSelectTerminal: (terminalId: string) => void;
  showSelector?: boolean;
}

function TerminalPane({
  session,
  sessions,
  isFocused,
  onMount,
  onFocus,
  onSelectTerminal,
  showSelector = false,
}: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && session && !session.terminal) {
      onMount(session.id, containerRef.current);
    }
  }, [session, onMount]);

  // Fit terminal when pane size changes
  useEffect(() => {
    if (session?.fitAddon && session?.terminal) {
      const timeout = setTimeout(() => {
        try {
          session.fitAddon?.fit();
        } catch {
          // Ignore fit errors
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [session]);

  if (!session) {
    return (
      <div
        className="h-full bg-[#1a1b26] flex flex-col items-center justify-center cursor-pointer"
        onClick={onFocus}
      >
        {showSelector && sessions.length > 0 ? (
          <div className="text-center">
            <p className="text-theme-secondary text-sm mb-3">Select a terminal for this pane</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTerminal(s.id);
                  }}
                  className="px-3 py-1.5 bg-theme-tertiary hover:bg-[var(--accent-primary)] text-theme-primary text-sm rounded transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-theme-secondary">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">No terminal</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`h-full bg-[#1a1b26] overflow-hidden ${
        isFocused ? 'ring-2 ring-[var(--accent-primary)] ring-inset' : ''
      }`}
      onClick={onFocus}
    >
      <div
        ref={containerRef}
        className="h-full w-full p-1"
      />
    </div>
  );
}

export function SplitPaneTerminals({
  sessions,
  layout,
  onMount,
  onUnmount,
  onFocusPane,
  onSizesChange,
  onSelectTerminalForPane,
}: SplitPaneTerminalsProps) {
  const primarySession = sessions.find(s => s.id === layout.primaryPaneId);
  const secondarySession = sessions.find(s => s.id === layout.secondaryPaneId);

  // Handle resize
  const handleResize = useCallback((sizes: number[]) => {
    if (sizes.length === 2) {
      onSizesChange([sizes[0], sizes[1]]);
    }
  }, [onSizesChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessions.forEach(session => {
        if (session.terminal) {
          onUnmount(session.id);
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refit terminals when layout mode changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      [primarySession, secondarySession].forEach(session => {
        if (session?.fitAddon) {
          try {
            session.fitAddon.fit();
          } catch {
            // Ignore
          }
        }
      });
    }, 150);
    return () => clearTimeout(timeout);
  }, [layout.mode, layout.direction]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Single pane mode
  if (layout.mode === 'single') {
    return (
      <div className="h-full bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-700 p-1">
        <TerminalPane
          session={primarySession}
          sessions={sessions}
          isFocused={true}
          onMount={onMount}
          onFocus={() => onFocusPane('primary')}
          onSelectTerminal={(id) => onSelectTerminalForPane('primary', id)}
          showSelector={!primarySession}
        />
      </div>
    );
  }

  // Split pane mode
  const direction = layout.direction === 'horizontal' ? 'horizontal' : 'vertical';

  return (
    <div className="h-full bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-700">
      <PanelGroup
        direction={direction}
        onLayout={handleResize}
        autoSaveId="terminal-split"
      >
        <Panel
          defaultSize={layout.sizes[0]}
          minSize={20}
        >
          <TerminalPane
            session={primarySession}
            sessions={sessions}
            isFocused={layout.focusedPane === 'primary'}
            onMount={onMount}
            onFocus={() => onFocusPane('primary')}
            onSelectTerminal={(id) => onSelectTerminalForPane('primary', id)}
            showSelector={!primarySession}
          />
        </Panel>

        <PanelResizeHandle
          className={`${
            direction === 'horizontal'
              ? 'w-1 hover:w-2 cursor-col-resize'
              : 'h-1 hover:h-2 cursor-row-resize'
          } bg-gray-700 hover:bg-[var(--accent-primary)] transition-all`}
        />

        <Panel
          defaultSize={layout.sizes[1]}
          minSize={20}
        >
          <TerminalPane
            session={secondarySession}
            sessions={sessions}
            isFocused={layout.focusedPane === 'secondary'}
            onMount={onMount}
            onFocus={() => onFocusPane('secondary')}
            onSelectTerminal={(id) => onSelectTerminalForPane('secondary', id)}
            showSelector={!secondarySession}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
