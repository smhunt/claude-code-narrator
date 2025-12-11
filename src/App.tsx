import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Terminal } from './components/Terminal';
import { Controls } from './components/Controls';
import { NarrationPanel } from './components/NarrationPanel';
import { TranscriptList } from './components/TranscriptList';
import { QuickCommands } from './components/QuickCommands';
import { ChangelogModal, APP_VERSION } from './components/ChangelogModal';
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
    sendCommand,
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
  const [showChangelog, setShowChangelog] = useState(false);

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

      <PanelGroup direction="horizontal" className="h-[calc(100vh-180px)]">
        {/* Main terminal area */}
        <Panel defaultSize={75} minSize={40}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65} minSize={20}>
              <div className="h-full pr-2 pb-1 flex flex-col gap-2">
                <div className="flex-1 min-h-0">
                  <Terminal terminalRef={terminalRef} />
                </div>
                {sessionId && <QuickCommands onCommand={sendCommand} />}
              </div>
            </Panel>

            <PanelResizeHandle className="h-2 flex items-center justify-center group cursor-row-resize">
              <div className="w-16 h-1 rounded-full bg-gray-700 group-hover:bg-blue-500 transition-colors" />
            </PanelResizeHandle>

            <Panel defaultSize={35} minSize={15}>
              <div className="h-full pr-2 pt-1 overflow-auto">
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
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-2 flex items-center justify-center group cursor-col-resize">
          <div className="h-16 w-1 rounded-full bg-gray-700 group-hover:bg-blue-500 transition-colors" />
        </PanelResizeHandle>

        {/* Sidebar */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full pl-2 flex flex-col gap-4 overflow-y-auto">
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
        </Panel>
      </PanelGroup>

      {/* Footer */}
      <footer className="mt-4 py-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            onClick={() => setShowChangelog(true)}
            className="hover:text-blue-400 transition-colors font-mono"
          >
            v{APP_VERSION}
          </button>
          <div className="text-center">
            Powered by{' '}
            <span className="text-blue-400 font-medium">Ecoworks Web Architecture</span>
          </div>
          <div className="text-gray-600">
            &copy; {new Date().getFullYear()} Ecoworks
          </div>
        </div>
      </footer>

      {/* Changelog Modal */}
      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}

export default App;
