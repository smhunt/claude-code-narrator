import { useCallback, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { socket, connectSocket } from '../lib/socket';
import { v4 as uuidv4 } from 'uuid';

export interface TerminalSession {
  id: string; // Client-side tab ID
  sessionId: string | null; // Server-side session ID
  sessionType: 'local' | 'ssh' | null;
  sshHost: string | null;
  isConnected: boolean;
  label: string;
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
  containerRef: HTMLDivElement | null;
}

export interface SSHConfig {
  host: string;
  user?: string;
  port?: number;
  defaultDir?: string;
  initialCommand?: string;
}

export interface LocalConfig {
  defaultDir?: string;
  initialCommand?: string;
}

export interface UseMultiTerminalReturn {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  setActiveSession: (id: string) => void;
  createSession: () => string;
  closeSession: (id: string) => void;
  startLocalSession: (tabId: string, config?: LocalConfig) => Promise<void>;
  startSSHSession: (tabId: string, config: SSHConfig) => Promise<void>;
  endSession: (tabId: string) => void;
  requestSummary: (tabId: string, level: 'high' | 'medium' | 'detailed') => void;
  sendCommand: (tabId: string, command: string) => void;
  mountTerminal: (tabId: string, container: HTMLDivElement) => void;
  unmountTerminal: (tabId: string) => void;
  getActiveSession: () => TerminalSession | null;
}

export function useMultiTerminal(): UseMultiTerminalReturn {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Keep track of socket handlers per session
  const sessionHandlers = useRef<Map<string, {
    dataHandler: (data: { data: string }) => void;
    exitHandler: () => void;
    startedHandler: (data: { id: string; type: string; sshHost?: string }) => void;
  }>>(new Map());

  // Ref to access current sessions in callbacks without stale closures
  const sessionsRef = useRef<TerminalSession[]>([]);
  sessionsRef.current = sessions;

  // Create terminal theme config
  const getTerminalConfig = () => {
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 10 : 14;

    return {
      cursorBlink: true,
      fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0',
      },
    };
  };

  // Create a new session tab
  const createSession = useCallback(() => {
    const tabId = uuidv4();
    const newSession: TerminalSession = {
      id: tabId,
      sessionId: null,
      sessionType: null,
      sshHost: null,
      isConnected: false,
      label: `Terminal ${sessions.length + 1}`,
      terminal: null,
      fitAddon: null,
      containerRef: null,
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(tabId);
    return tabId;
  }, [sessions.length]);

  // Mount terminal to container
  const mountTerminal = useCallback((tabId: string, container: HTMLDivElement) => {
    // Check using ref first to avoid unnecessary state updates
    const existingSession = sessionsRef.current.find(s => s.id === tabId);
    if (!existingSession) return;

    // Don't remount if already mounted to the same container
    if (existingSession.terminal && existingSession.containerRef === container) {
      return;
    }

    // Create new terminal if needed
    let terminal = existingSession.terminal;
    let fitAddon = existingSession.fitAddon;

    if (!terminal) {
      terminal = new Terminal(getTerminalConfig());
      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
    }

    // Open terminal in container
    terminal.open(container);

    // Fit after mount with multiple attempts to ensure proper sizing
    const doFit = () => {
      try {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          fitAddon?.fit();
          terminal?.scrollToBottom();
        }
      } catch (e) {
        // Ignore fit errors
      }
    };

    // Multiple fit attempts to handle layout settling
    requestAnimationFrame(doFit);
    setTimeout(doFit, 50);
    setTimeout(doFit, 150);

    // Setup input handler - use ref to avoid stale closure
    terminal.onData((data) => {
      const currentSession = sessionsRef.current.find(s => s.id === tabId);
      if (currentSession?.sessionId) {
        socket.emit('terminal:input', { data, sessionId: currentSession.sessionId });
      }
    });

    // Setup resize observer - use ref to avoid stale closure
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          fitAddon?.fit();
          // Scroll to bottom after fit
          terminal?.scrollToBottom();
          if (terminal?.cols && terminal?.rows) {
            const currentSession = sessionsRef.current.find(s => s.id === tabId);
            if (currentSession?.sessionId) {
              socket.emit('terminal:resize', {
                cols: terminal.cols,
                rows: terminal.rows,
                sessionId: currentSession.sessionId
              });
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    });
    resizeObserver.observe(container);

    // Now update state with the new terminal
    setSessions(prev => prev.map(session => {
      if (session.id !== tabId) return session;
      return {
        ...session,
        terminal,
        fitAddon,
        containerRef: container,
      };
    }));
  }, []); // No deps - uses sessionsRef for current state

  // Unmount terminal from container
  const unmountTerminal = useCallback((tabId: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== tabId) return session;
      return { ...session, containerRef: null };
    }));
  }, []);

  // Close a session tab
  const closeSession = useCallback((tabId: string) => {
    const session = sessions.find(s => s.id === tabId);
    if (!session) return;

    // Clean up terminal
    if (session.terminal) {
      session.terminal.dispose();
    }

    // Clean up socket handlers
    const handlers = sessionHandlers.current.get(tabId);
    if (handlers) {
      socket.off('terminal:output', handlers.dataHandler);
      socket.off('terminal:exit', handlers.exitHandler);
      socket.off('session:started', handlers.startedHandler);
      sessionHandlers.current.delete(tabId);
    }

    // End server session
    if (session.sessionId) {
      socket.emit('session:end', { sessionId: session.sessionId });
    }

    // Remove from state
    setSessions(prev => prev.filter(s => s.id !== tabId));

    // Switch to another tab if needed
    if (activeSessionId === tabId) {
      const remainingSessions = sessions.filter(s => s.id !== tabId);
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  }, [sessions, activeSessionId]);

  // Setup socket handlers for a session
  const setupSocketHandlers = useCallback((tabId: string) => {
    // Remove existing handlers if any
    const existing = sessionHandlers.current.get(tabId);
    if (existing) {
      socket.off('terminal:output', existing.dataHandler);
      socket.off('terminal:exit', existing.exitHandler);
      socket.off('session:started', existing.startedHandler);
    }

    const dataHandler = (data: { data: string; sessionId?: string }) => {
      setSessions(prev => {
        const session = prev.find(s => s.id === tabId);
        if (session?.terminal && (!data.sessionId || data.sessionId === session.sessionId)) {
          session.terminal.write(data.data);
        }
        return prev;
      });
    };

    const exitHandler = () => {
      setSessions(prev => prev.map(s =>
        s.id === tabId ? { ...s, isConnected: false } : s
      ));
    };

    const startedHandler = (data: { id: string; type: string; sshHost?: string }) => {
      setSessions(prev => prev.map(s => {
        if (s.id !== tabId) return s;

        const label = data.type === 'ssh' && data.sshHost
          ? data.sshHost.split('@').pop() || data.sshHost
          : `Local ${prev.filter(x => x.sessionType === 'local').length + 1}`;

        return {
          ...s,
          sessionId: data.id,
          sessionType: (data.type as 'local' | 'ssh') || 'local',
          sshHost: data.sshHost || null,
          isConnected: true,
          label,
        };
      }));
    };

    sessionHandlers.current.set(tabId, { dataHandler, exitHandler, startedHandler });

    socket.on('terminal:output', dataHandler);
    socket.on('terminal:exit', exitHandler);
    socket.on('session:started', startedHandler);
  }, []);

  // Start local session
  const startLocalSession = useCallback(async (tabId: string, config?: LocalConfig) => {
    try {
      await connectSocket();
      setupSocketHandlers(tabId);

      setSessions(prev => prev.map(s =>
        s.id === tabId ? { ...s, isConnected: true, sessionType: 'local' } : s
      ));

      socket.emit('terminal:start', config || {});
    } catch (error) {
      console.error('Failed to start local session:', error);
    }
  }, [setupSocketHandlers]);

  // Start SSH session
  const startSSHSession = useCallback(async (tabId: string, config: SSHConfig) => {
    try {
      await connectSocket();
      setupSocketHandlers(tabId);

      setSessions(prev => prev.map(s =>
        s.id === tabId ? { ...s, isConnected: true, sessionType: 'ssh', label: config.host } : s
      ));

      socket.emit('terminal:ssh', config);
    } catch (error) {
      console.error('Failed to start SSH session:', error);
    }
  }, [setupSocketHandlers]);

  // End session (but keep tab)
  const endSession = useCallback((tabId: string) => {
    const session = sessions.find(s => s.id === tabId);
    if (!session?.sessionId) return;

    socket.emit('session:end', { sessionId: session.sessionId });

    setSessions(prev => prev.map(s =>
      s.id === tabId
        ? { ...s, sessionId: null, isConnected: false, sessionType: null, sshHost: null }
        : s
    ));
  }, [sessions]);

  // Request summary
  const requestSummary = useCallback((tabId: string, level: 'high' | 'medium' | 'detailed') => {
    const session = sessions.find(s => s.id === tabId);
    if (session?.sessionId) {
      socket.emit('summarize', { level, sessionId: session.sessionId });
    }
  }, [sessions]);

  // Send command
  const sendCommand = useCallback((tabId: string, command: string) => {
    const session = sessions.find(s => s.id === tabId);
    if (session?.sessionId) {
      socket.emit('terminal:input', { data: command, sessionId: session.sessionId });
    }
  }, [sessions]);

  // Set active session
  const setActiveSession = useCallback((id: string) => {
    setActiveSessionId(id);

    // Focus the terminal and fit it using ref to avoid state updates
    const session = sessionsRef.current.find(s => s.id === id);
    if (session?.terminal && session.fitAddon && session.containerRef) {
      requestAnimationFrame(() => {
        try {
          session.fitAddon?.fit();
          session.terminal?.focus();
        } catch (e) {
          // Ignore errors
        }
      });
    }
  }, []);

  // Get active session
  const getActiveSession = useCallback(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  return {
    sessions,
    activeSessionId,
    setActiveSession,
    createSession,
    closeSession,
    startLocalSession,
    startSSHSession,
    endSession,
    requestSummary,
    sendCommand,
    mountTerminal,
    unmountTerminal,
    getActiveSession,
  };
}
