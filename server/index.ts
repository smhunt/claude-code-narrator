import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
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
    version: '1.0.0',
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentSessionId: string | null = null;

  socket.on('terminal:start', () => {
    currentSessionId = uuidv4();
    const dbSession = createSession(currentSessionId);
    const ptySession = ptyManager.spawn(currentSessionId);

    socket.emit('session:started', {
      id: currentSessionId,
      startedAt: dbSession.started_at,
    });

    // Forward PTY output to client
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
        // Save transcript before killing
        const lines = ptyManager.getTranscriptLines(currentSessionId);
        const session = getSession(currentSessionId);
        if (session && lines.length > 0) {
          const transcriptPath = saveTranscript(currentSessionId, lines, session.started_at);
          endSession(currentSessionId, transcriptPath);
        }
        ptyManager.kill(currentSessionId);
      }
    });
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
