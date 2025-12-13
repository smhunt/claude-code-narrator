import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export interface PTYSession {
  id: string;
  pty: pty.IPty;
  transcript: string[];
  startedAt: number;
  type: 'local' | 'ssh';
  sshHost?: string;
}

export interface SSHOptions {
  host: string;
  user?: string;
  port?: number;
  defaultDir?: string; // Directory to cd to after connecting
  initialCommand?: string; // Command to run after cd (e.g., 'claude')
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
      type: 'local',
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

  spawnSSH(sessionId: string, options: SSHOptions): PTYSession {
    const { host, user, port = 22, defaultDir, initialCommand } = options;

    // Build SSH command
    const sshArgs: string[] = [];
    if (port !== 22) {
      sshArgs.push('-p', String(port));
    }
    // Disable strict host key checking for convenience (user can enable if needed)
    sshArgs.push('-o', 'StrictHostKeyChecking=accept-new');

    const target = user ? `${user}@${host}` : host;
    sshArgs.push(target);

    const ptyProcess = pty.spawn('ssh', sshArgs, {
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
      type: 'ssh',
      sshHost: target,
    };

    // Track if we've sent post-connect commands
    let postConnectSent = false;
    const sendPostConnectCommands = () => {
      if (postConnectSent) return;
      postConnectSent = true;

      // Small delay to ensure shell is ready
      setTimeout(() => {
        // cd to default directory if specified
        if (defaultDir) {
          ptyProcess.write(`cd ${defaultDir}\r`);
        }
        // Run initial command if specified (with a brief delay after cd)
        if (initialCommand) {
          setTimeout(() => {
            ptyProcess.write(`${initialCommand}\r`);
          }, defaultDir ? 300 : 0);
        }
      }, 500);
    };

    ptyProcess.onData((data) => {
      session.transcript.push(data);
      this.emit('data', sessionId, data);

      // Detect shell prompt to send post-connect commands
      // Look for common prompt indicators after initial connection
      if (!postConnectSent && (defaultDir || initialCommand)) {
        // Check for shell prompt patterns ($ % > # or user@host:)
        if (/[$%>#]\s*$/.test(data) || /@.*:\s*$/.test(data)) {
          sendPostConnectCommands();
        }
      }
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
