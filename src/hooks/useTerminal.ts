import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { socket, connectSocket } from '../lib/socket';

export interface UseTerminalReturn {
  terminalRef: React.RefObject<HTMLDivElement | null>;
  isConnected: boolean;
  sessionId: string | null;
  startSession: () => Promise<void>;
  endSession: () => void;
  requestSummary: (level: 'high' | 'medium' | 'detailed') => void;
}

export function useTerminal(): UseTerminalReturn {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current || terminalInstance.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
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
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    fit.fit();

    terminalInstance.current = term;
    fitAddon.current = fit;

    // Handle terminal input
    term.onData((data) => {
      socket.emit('terminal:input', { data });
    });

    // Handle resize
    const handleResize = () => {
      fit.fit();
      socket.emit('terminal:resize', { cols: term.cols, rows: term.rows });
    };
    window.addEventListener('resize', handleResize);

    // Socket event handlers
    socket.on('terminal:output', ({ data }) => {
      term.write(data);
    });

    socket.on('session:started', ({ id }) => {
      setSessionId(id);
      term.clear();
      term.focus();
    });

    socket.on('terminal:exit', () => {
      term.writeln('\r\n[Session ended]');
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('terminal:output');
      socket.off('session:started');
      socket.off('terminal:exit');
      term.dispose();
      terminalInstance.current = null;
    };
  }, []);

  const startSession = useCallback(async () => {
    try {
      await connectSocket();
      setIsConnected(true);
      socket.emit('terminal:start');
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, []);

  const endSession = useCallback(() => {
    socket.emit('session:end');
    setSessionId(null);
  }, []);

  const requestSummary = useCallback((level: 'high' | 'medium' | 'detailed') => {
    socket.emit('summarize', { level });
  }, []);

  return {
    terminalRef,
    isConnected,
    sessionId,
    startSession,
    endSession,
    requestSummary,
  };
}
