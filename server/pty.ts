import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export interface PTYSession {
  id: string;
  pty: pty.IPty;
  transcript: string[];
  startedAt: number;
  type: 'local' | 'ssh';
  sshHost?: string;
  tmuxSession?: string;
}

export interface LocalOptions {
  defaultDir?: string; // Directory to cd to after starting
  initialCommand?: string; // Command to run after cd (e.g., 'claude')
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

  // Detect if running inside tmux and get session name
  private detectTmux(sessionId: string, ptyProcess: pty.IPty): void {
    const marker = `__TMUX_${Date.now()}__`;
    let capturing = false;
    let capturedOutput = '';

    // Temporary listener to capture tmux detection output
    const captureListener = (data: string) => {
      if (data.includes(marker)) {
        capturing = true;
      }
      if (capturing) {
        capturedOutput += data;
        // Check if we have both markers
        const startIdx = capturedOutput.indexOf(marker);
        const endIdx = capturedOutput.lastIndexOf(marker);
        if (startIdx !== endIdx && endIdx > startIdx) {
          // Extract tmux session name between markers
          const between = capturedOutput.substring(startIdx + marker.length, endIdx);
          const tmuxSession = between.trim().split('\n')[0].trim();

          if (tmuxSession && !tmuxSession.includes('no server') && !tmuxSession.includes('error')) {
            const session = this.sessions.get(sessionId);
            if (session) {
              session.tmuxSession = tmuxSession;
              this.emit('tmux:detected', sessionId, tmuxSession);
            }
          }
        }
      }
    };

    // Add temporary listener
    ptyProcess.onData(captureListener);

    // Send detection command
    ptyProcess.write(`echo "${marker}$(tmux display-message -p '#S' 2>/dev/null)${marker}"\r`);

    // Remove listener after timeout
    setTimeout(() => {
      // The listener will be garbage collected since we don't store reference
    }, 3000);
  }

  spawn(sessionId: string, options?: LocalOptions): PTYSession {
    const shell = process.env.SHELL || '/bin/bash';
    const { defaultDir, initialCommand } = options || {};

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

    // Send startup commands after shell is ready
    if (defaultDir || initialCommand) {
      setTimeout(() => {
        if (defaultDir) {
          ptyProcess.write(`cd ${defaultDir}\r`);
        }
        if (initialCommand) {
          setTimeout(() => {
            ptyProcess.write(`${initialCommand}\r`);
          }, defaultDir ? 500 : 0);
        }
      }, 800);
    }

    // Detect tmux after shell is ready
    setTimeout(() => {
      this.detectTmux(sessionId, ptyProcess);
    }, 1200);

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
    let tmuxDetectionScheduled = false;
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
        // Detect tmux after post-connect commands
        if (!tmuxDetectionScheduled) {
          tmuxDetectionScheduled = true;
          setTimeout(() => {
            this.detectTmux(sessionId, ptyProcess);
          }, 1000);
        }
      }, 500);
    };

    // Schedule tmux detection even if no post-connect commands
    const scheduleTmuxDetection = () => {
      if (tmuxDetectionScheduled) return;
      tmuxDetectionScheduled = true;
      setTimeout(() => {
        this.detectTmux(sessionId, ptyProcess);
      }, 1500);
    };

    ptyProcess.onData((data) => {
      session.transcript.push(data);
      this.emit('data', sessionId, data);

      // Detect shell prompt to send post-connect commands and tmux detection
      // Look for common prompt indicators after initial connection
      const isShellPrompt = /[$%>#]\s*$/.test(data);
      const isPasswordPrompt = /password:/i.test(data);

      if (isShellPrompt && !isPasswordPrompt) {
        if (!postConnectSent && (defaultDir || initialCommand)) {
          sendPostConnectCommands();
        } else if (!tmuxDetectionScheduled) {
          // No post-connect commands, but still detect tmux
          scheduleTmuxDetection();
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

  getTmuxSession(sessionId: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.tmuxSession;
  }
}

export const ptyManager = new PTYManager();
