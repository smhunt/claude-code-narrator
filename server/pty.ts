import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export interface PTYSession {
  id: string;
  pty: pty.IPty;
  transcript: string[];
  startedAt: number;
}

class PTYManager extends EventEmitter {
  private sessions: Map<string, PTYSession> = new Map();

  spawn(sessionId: string): PTYSession {
    const shell = process.env.SHELL || '/bin/bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env as { [key: string]: string },
    });

    const session: PTYSession = {
      id: sessionId,
      pty: ptyProcess,
      transcript: [],
      startedAt: Date.now(),
    };

    ptyProcess.onData((data) => {
      session.transcript.push(data);
      this.emit('data', sessionId, data);
    });

    ptyProcess.onExit(({ exitCode }) => {
      this.emit('exit', sessionId, exitCode);
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.resize(cols, rows);
    }
  }

  getTranscript(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    return session ? session.transcript.join('') : '';
  }

  getTranscriptLines(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.transcript] : [];
  }

  kill(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.kill();
      this.sessions.delete(sessionId);
    }
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

export const ptyManager = new PTYManager();
