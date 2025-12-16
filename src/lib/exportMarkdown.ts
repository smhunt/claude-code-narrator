import type { Session, TranscriptData } from '../hooks/useTranscripts';

export interface ExportOptions {
  includeSummaries?: boolean;
  includeTranscript?: boolean;
  includeMetadata?: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeSummaries: true,
  includeTranscript: true,
  includeMetadata: true,
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatDuration(start: number, end: number | null): string {
  if (!end) return 'In progress';
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

function escapeMarkdown(text: string): string {
  // Escape backticks in code blocks
  return text.replace(/```/g, '\\`\\`\\`');
}

export function sessionToMarkdown(
  session: Session,
  transcript: TranscriptData | null,
  options: ExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Title
  lines.push(`# Terminal Session Export`);
  lines.push('');
  lines.push(`**Session ID:** \`${session.id}\``);
  lines.push('');

  // Metadata
  if (opts.includeMetadata) {
    lines.push('## Session Info');
    lines.push('');
    lines.push(`| Property | Value |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Started | ${formatDate(session.started_at)} |`);
    lines.push(`| Ended | ${session.ended_at ? formatDate(session.ended_at) : 'In progress'} |`);
    lines.push(`| Duration | ${formatDuration(session.started_at, session.ended_at)} |`);

    if (session.ssh_host) {
      lines.push(`| SSH Host | ${session.ssh_host} |`);
    }
    if (session.tmux_session) {
      lines.push(`| Tmux Session | ${session.tmux_session} |`);
    }
    lines.push('');
  }

  // Summaries
  if (opts.includeSummaries) {
    const hasSummaries = session.summary_high || session.summary_medium || session.summary_detailed;

    if (hasSummaries) {
      lines.push('## AI Summaries');
      lines.push('');

      if (session.summary_high) {
        lines.push('### Brief Summary');
        lines.push('');
        lines.push(session.summary_high);
        lines.push('');
      }

      if (session.summary_medium) {
        lines.push('### Standard Summary');
        lines.push('');
        lines.push(session.summary_medium);
        lines.push('');
      }

      if (session.summary_detailed) {
        lines.push('### Detailed Summary');
        lines.push('');
        lines.push(session.summary_detailed);
        lines.push('');
      }
    }
  }

  // Transcript
  if (opts.includeTranscript && transcript) {
    lines.push('## Raw Transcript');
    lines.push('');
    lines.push('```');
    lines.push(escapeMarkdown(transcript.rawText || transcript.lines.join('\n')));
    lines.push('```');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Exported from Claude Code Narrator on ${new Date().toLocaleString()}*`);

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function generateFilename(session: Session): string {
  const date = new Date(session.started_at);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const prefix = session.ssh_host ? `ssh-${session.ssh_host.replace(/[^a-zA-Z0-9]/g, '-')}` : 'local';

  return `session-${prefix}-${dateStr}-${timeStr}.md`;
}
