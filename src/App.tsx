import { useState, useEffect, useCallback } from 'react';
import { Terminal } from './components/Terminal';
import { Controls } from './components/Controls';
import { NarrationPanel } from './components/NarrationPanel';
import { TranscriptList } from './components/TranscriptList';
import { useTerminal } from './hooks/useTerminal';
import { useTTS } from './hooks/useTTS';
import { useTranscripts, type Session } from './hooks/useTranscripts';
import { socket } from './lib/socket';

type DetailLevel = 'high' | 'medium' | 'detailed';

function App() {
  const {
    terminalRef,
    isConnected,
    sessionId,
    sessionType,
    sshHost,
    startSession,
    startSSHSession,
    endSession,
    requestSummary,
  } = useTerminal();

  const {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    voices,
    settings: ttsSettings,
    updateSettings: updateTTSSettings,
  } = useTTS();

  const {
    sessions,
    loading: sessionsLoading,
    refresh: refreshSessions,
    deleteSession,
    summarizeSession,
  } = useTranscripts();

  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium');
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [summaryLevel, setSummaryLevel] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check API status on mount
  useEffect(() => {
    fetch('http://10.10.10.24:3086/api/status')
      .then((res) => res.json())
      .then((data) => setApiAvailable(data.apiAvailable))
      .catch(() => setApiAvailable(false));
  }, []);

  // Listen for summary results
  useEffect(() => {
    const handleSummaryStarted = () => {
      setIsSummarizing(true);
    };

    const handleSummaryResult = ({ text, level }: { text: string; level: string }) => {
      setCurrentSummary(text);
      setSummaryLevel(level);
      setIsSummarizing(false);
    };

    const handleSummaryError = () => {
      setIsSummarizing(false);
    };

    const handleSessionSaved = () => {
      refreshSessions();
    };

    socket.on('summary:started', handleSummaryStarted);
    socket.on('summary:result', handleSummaryResult);
    socket.on('summary:error', handleSummaryError);
    socket.on('session:saved', handleSessionSaved);

    return () => {
      socket.off('summary:started', handleSummaryStarted);
      socket.off('summary:result', handleSummaryResult);
      socket.off('summary:error', handleSummaryError);
      socket.off('session:saved', handleSessionSaved);
    };
  }, [refreshSessions]);

  const handleSummarize = useCallback(
    (level: DetailLevel) => {
      if (sessionId) {
        requestSummary(level);
      }
    },
    [sessionId, requestSummary]
  );

  const handleSelectSession = useCallback(
    async (session: Session) => {
      setSelectedSession(session);

      // Show existing summary if available
      const existingSummary =
        detailLevel === 'high'
          ? session.summary_high
          : detailLevel === 'medium'
            ? session.summary_medium
            : session.summary_detailed;

      if (existingSummary) {
        setCurrentSummary(existingSummary);
        setSummaryLevel(detailLevel);
      } else {
        // Generate new summary
        setIsSummarizing(true);
        try {
          const summary = await summarizeSession(session.id, detailLevel);
          setCurrentSummary(summary);
          setSummaryLevel(detailLevel);
        } catch {
          setCurrentSummary('Failed to generate summary');
        } finally {
          setIsSummarizing(false);
        }
      }
    },
    [detailLevel, summarizeSession]
  );

  const handleSpeak = useCallback(() => {
    if (currentSummary) {
      speak(currentSummary);
    }
  }, [currentSummary, speak]);

  const handleEndSession = useCallback(() => {
    endSession();
    setCurrentSummary(null);
    setSummaryLevel(null);
  }, [endSession]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Claude Code Narrator</h1>
        <p className="text-gray-400 text-sm">
          Terminal session capture with AI-powered narration
        </p>
        {apiAvailable === false && (
          <p className="text-yellow-500 text-sm mt-1">
            No ANTHROPIC_API_KEY detected - using mock summaries
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        {/* Main terminal area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Terminal terminalRef={terminalRef} />
          <NarrationPanel
            summary={currentSummary}
            summaryLevel={summaryLevel}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onSpeak={handleSpeak}
            onStop={stop}
            onPause={pause}
            onResume={resume}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <Controls
            isConnected={isConnected}
            sessionId={sessionId}
            sessionType={sessionType}
            sshHost={sshHost}
            onStartSession={startSession}
            onStartSSHSession={startSSHSession}
            onEndSession={handleEndSession}
            onSummarize={handleSummarize}
            detailLevel={detailLevel}
            onDetailLevelChange={setDetailLevel}
            ttsSettings={ttsSettings}
            onTTSSettingsChange={updateTTSSettings}
            voices={voices}
            isSummarizing={isSummarizing}
          />
          <TranscriptList
            sessions={sessions}
            loading={sessionsLoading}
            onRefresh={refreshSessions}
            onSelect={handleSelectSession}
            onDelete={deleteSession}
            selectedId={selectedSession?.id ?? null}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
