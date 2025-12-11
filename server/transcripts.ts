import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = path.join(process.cwd(), 'data', 'transcripts');

// Ensure directory exists
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

export interface TranscriptData {
  id: string;
  startedAt: number;
  endedAt: number;
  lines: string[];
  rawText: string;
}

export function saveTranscript(id: string, lines: string[], startedAt: number): string {
  const data: TranscriptData = {
    id,
    startedAt,
    endedAt: Date.now(),
    lines,
    rawText: lines.join(''),
  };

  const filePath = path.join(TRANSCRIPTS_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return filePath;
}

export function loadTranscript(id: string): TranscriptData | null {
  const filePath = path.join(TRANSCRIPTS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as TranscriptData;
}

export function deleteTranscript(id: string): boolean {
  const filePath = path.join(TRANSCRIPTS_DIR, `${id}.json`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
}

export function getTranscriptPath(id: string): string {
  return path.join(TRANSCRIPTS_DIR, `${id}.json`);
}
