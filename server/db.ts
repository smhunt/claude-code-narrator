import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'narrator.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    transcript_path TEXT,
    summary_high TEXT,
    summary_medium TEXT,
    summary_detailed TEXT
  )
`);

export interface Session {
  id: string;
  started_at: number;
  ended_at: number | null;
  transcript_path: string | null;
  summary_high: string | null;
  summary_medium: string | null;
  summary_detailed: string | null;
}

export function createSession(id: string): Session {
  const now = Date.now();
  db.prepare(`
    INSERT INTO sessions (id, started_at) VALUES (?, ?)
  `).run(id, now);

  return {
    id,
    started_at: now,
    ended_at: null,
    transcript_path: null,
    summary_high: null,
    summary_medium: null,
    summary_detailed: null,
  };
}

export function endSession(id: string, transcriptPath: string): void {
  db.prepare(`
    UPDATE sessions SET ended_at = ?, transcript_path = ? WHERE id = ?
  `).run(Date.now(), transcriptPath, id);
}

export function updateSummary(id: string, level: 'high' | 'medium' | 'detailed', summary: string): void {
  const column = `summary_${level}`;
  db.prepare(`UPDATE sessions SET ${column} = ? WHERE id = ?`).run(summary, id);
}

export function getSession(id: string): Session | undefined {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined;
}

export function getAllSessions(): Session[] {
  return db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all() as Session[];
}

export function deleteSession(id: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export default db;
