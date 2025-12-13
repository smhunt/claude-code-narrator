import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { ptyManager } from './pty.js';
import { summarize, isAPIAvailable, type DetailLevel } from './summarizer.js';
import { saveTranscript, loadTranscript, deleteTranscript } from './transcripts.js';
import {
  createSession,
  endSession,
  updateSummary,
  getSession,
  getAllSessions,
  deleteSession,
} from './db.js';

// OpenAI TTS setup
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

const PORT = 3086;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// REST API endpoints
app.get('/api/sessions', (_req, res) => {
  const sessions = getAllSessions();
  res.json(sessions);
});

app.get('/api/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const transcript = session.transcript_path ? loadTranscript(req.params.id) : null;
  res.json({ ...session, transcript });
});

app.post('/api/sessions/:id/summarize', async (req, res) => {
  const { level } = req.body as { level: DetailLevel };
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const transcript = loadTranscript(req.params.id);
  if (!transcript) {
    return res.status(404).json({ error: 'Transcript not found' });
  }

  const summary = await summarize(transcript.rawText, level);
  updateSummary(req.params.id, level, summary);

  res.json({ summary, level });
});

app.delete('/api/sessions/:id', (req, res) => {
  deleteTranscript(req.params.id);
  deleteSession(req.params.id);
  res.json({ success: true });
});

app.get('/api/status', (_req, res) => {
  res.json({
    apiAvailable: isAPIAvailable(),
    openaiTTSAvailable: !!openai,
    version: '1.0.0',
  });
});

// Read and summarize Claude export file
app.post('/api/claude-export', async (req, res) => {
  const { filePath, level = 'medium' } = req.body as { filePath: string; level?: DetailLevel };

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Resolve the path (handle ~ for home directory)
    let resolvedPath = filePath;
    if (filePath.startsWith('~')) {
      resolvedPath = path.join(process.env.HOME || '', filePath.slice(1));
    }

    // Read the Claude export file
    const content = await fs.readFile(resolvedPath, 'utf-8');

    if (!content || content.length < 10) {
      return res.status(404).json({ error: 'Export file is empty or not found' });
    }

    // Summarize the Claude transcript
    const summary = await summarize(content, level);

    res.json({ summary, level, source: 'claude-export', chars: content.length });
  } catch (error) {
    console.error('Claude export error:', error);
    res.status(500).json({ error: 'Failed to read or summarize Claude export' });
  }
});

// OpenAI TTS endpoint
app.post('/api/tts', async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: 'OpenAI API key not configured' });
  }

  const { text, voice = 'nova', speed = 1.0 } = req.body as {
    text: string;
    voice?: TTSVoice;
    speed?: number;
  };

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed: Math.max(0.25, Math.min(4.0, speed)),
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentSessionId: string | null = null;

  // Helper to set up PTY event handlers
  const setupPTYHandlers = () => {
    const dataHandler = (sessionId: string, data: string) => {
      if (sessionId === currentSessionId) {
        socket.emit('terminal:output', { data });
      }
    };

    const exitHandler = (sessionId: string, exitCode: number) => {
      if (sessionId === currentSessionId) {
        socket.emit('terminal:exit', { exitCode });
      }
    };

    ptyManager.on('data', dataHandler);
    ptyManager.on('exit', exitHandler);

    socket.on('disconnect', () => {
      ptyManager.off('data', dataHandler);
      ptyManager.off('exit', exitHandler);
      if (currentSessionId && ptyManager.has(currentSessionId)) {
        const lines = ptyManager.getTranscriptLines(currentSessionId);
        const session = getSession(currentSessionId);
        if (session && lines.length > 0) {
          const transcriptPath = saveTranscript(currentSessionId, lines, session.started_at);
          endSession(currentSessionId, transcriptPath);
        }
        ptyManager.kill(currentSessionId);
      }
    });
  };

  // Start local terminal session
  socket.on('terminal:start', () => {
    currentSessionId = uuidv4();
    const dbSession = createSession(currentSessionId);
    ptyManager.spawn(currentSessionId);

    socket.emit('session:started', {
      id: currentSessionId,
      startedAt: dbSession.started_at,
      type: 'local',
    });

    setupPTYHandlers();
  });

  // Start SSH session
  socket.on('terminal:ssh', ({ host, user, port, defaultDir, initialCommand }: {
    host: string;
    user?: string;
    port?: number;
    defaultDir?: string;
    initialCommand?: string;
  }) => {
    currentSessionId = uuidv4();
    const dbSession = createSession(currentSessionId);

    try {
      ptyManager.spawnSSH(currentSessionId, { host, user, port, defaultDir, initialCommand });

      socket.emit('session:started', {
        id: currentSessionId,
        startedAt: dbSession.started_at,
        type: 'ssh',
        sshHost: user ? `${user}@${host}` : host,
      });

      setupPTYHandlers();
    } catch (error) {
      socket.emit('session:error', { error: 'Failed to start SSH session' });
    }
  });

  socket.on('terminal:input', ({ data }) => {
    if (currentSessionId) {
      ptyManager.write(currentSessionId, data);
    }
  });

  socket.on('terminal:resize', ({ cols, rows }) => {
    if (currentSessionId) {
      ptyManager.resize(currentSessionId, cols, rows);
    }
  });

  socket.on('session:end', async () => {
    if (!currentSessionId) return;

    const lines = ptyManager.getTranscriptLines(currentSessionId);
    const session = getSession(currentSessionId);

    if (session && lines.length > 0) {
      const transcriptPath = saveTranscript(currentSessionId, lines, session.started_at);
      endSession(currentSessionId, transcriptPath);
    }

    ptyManager.kill(currentSessionId);
    socket.emit('session:saved', { id: currentSessionId });
    currentSessionId = null;
  });

  socket.on('summarize', async ({ level }: { level: DetailLevel }) => {
    if (!currentSessionId) return;

    const transcript = ptyManager.getTranscript(currentSessionId);
    if (!transcript) {
      socket.emit('summary:error', { error: 'No transcript available' });
      return;
    }

    socket.emit('summary:started', { level });

    try {
      const summary = await summarize(transcript, level);
      const session = getSession(currentSessionId);
      if (session) {
        updateSummary(currentSessionId, level, summary);
      }
      socket.emit('summary:result', { text: summary, level });
    } catch (error) {
      socket.emit('summary:error', { error: 'Summarization failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`API available: ${isAPIAvailable()}`);
});
