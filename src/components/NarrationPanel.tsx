interface NarrationPanelProps {
  summary: string | null;
  summaryLevel: string | null;
  isSpeaking: boolean;
  isPaused: boolean;
  onSpeak: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function NarrationPanel({
  summary,
  summaryLevel,
  isSpeaking,
  isPaused,
  onSpeak,
  onStop,
  onPause,
  onResume,
}: NarrationPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Narration</h2>
        {summaryLevel && (
          <span className="text-xs px-2 py-1 bg-purple-600 rounded-full capitalize">
            {summaryLevel === 'high' ? 'Brief' : summaryLevel === 'detailed' ? 'Detailed' : 'Standard'}
          </span>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
        {summary ? (
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{summary}</p>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Click "Summarize Now" to generate a narration of the current session.
          </p>
        )}
      </div>

      {summary && (
        <div className="flex gap-2">
          {!isSpeaking ? (
            <button
              onClick={onSpeak}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <PlayIcon />
              Play
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <PlayIcon />
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <PauseIcon />
                  Pause
                </button>
              )}
              <button
                onClick={onStop}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <StopIcon />
                Stop
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
        clipRule="evenodd"
      />
    </svg>
  );
}
