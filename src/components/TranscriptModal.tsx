import type { TranscriptData } from '../hooks/useTranscripts';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: TranscriptData | null;
  sessionId: string | null;
  isLoading: boolean;
}

export function TranscriptModal({
  isOpen,
  onClose,
  transcript,
  sessionId,
  isLoading,
}: TranscriptModalProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: number, end: number) => {
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Session Transcript
            </h2>
            {sessionId && (
              <p className="text-sm text-gray-400 font-mono">{sessionId.slice(0, 8)}...</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-400">Loading transcript...</span>
            </div>
          ) : transcript ? (
            <>
              {/* Metadata */}
              <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-gray-700 rounded-lg">
                  <span className="text-gray-400">Started:</span>{' '}
                  <span className="text-white">{formatDate(transcript.startedAt)}</span>
                </div>
                <div className="px-3 py-1 bg-gray-700 rounded-lg">
                  <span className="text-gray-400">Duration:</span>{' '}
                  <span className="text-white">{formatDuration(transcript.startedAt, transcript.endedAt)}</span>
                </div>
                <div className="px-3 py-1 bg-gray-700 rounded-lg">
                  <span className="text-gray-400">Lines:</span>{' '}
                  <span className="text-white">{transcript.lines.length}</span>
                </div>
                <div className="px-3 py-1 bg-gray-700 rounded-lg">
                  <span className="text-gray-400">Characters:</span>{' '}
                  <span className="text-white">{transcript.rawText.length.toLocaleString()}</span>
                </div>
              </div>

              {/* Info banner */}
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-blue-300">
                  This is the raw terminal output that the AI summarizer uses to generate narration summaries.
                </p>
              </div>

              {/* Transcript content */}
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words text-gray-300">
                  {transcript.rawText || '(Empty transcript)'}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No transcript available for this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
