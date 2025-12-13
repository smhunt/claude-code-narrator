import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Terminal } from './components/Terminal';
import { Controls } from './components/Controls';
import { NarrationPanel } from './components/NarrationPanel';
import { TranscriptList } from './components/TranscriptList';
import { QuickCommands } from './components/QuickCommands';
import { ChangelogModal, APP_VERSION } from './components/ChangelogModal';
import { TranscriptModal } from './components/TranscriptModal';
import { ProductTour } from './components/ProductTour';
import { useTerminal } from './hooks/useTerminal';
import { useTTS } from './hooks/useTTS';
import { useTranscripts, type Session, type TranscriptData } from './hooks/useTranscripts';
import { useTour } from './hooks/useTour';
import { socket, BACKEND_URL } from './lib/socket';
import { useToast } from './components/Toast';
import { loadSavedTheme, applyTheme, type Theme } from './lib/themes';

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
    isLoading: ttsLoading,
    voices,
    settings: ttsSettings,
    updateSettings: updateTTSSettings,
    openaiAvailable,
  } = useTTS();

  const {
    sessions,
    loading: sessionsLoading,
    refresh: refreshSessions,
    getSession,
    deleteSession,
    summarizeSession,
  } = useTranscripts();

  const toast = useToast();

  const {
    isActive: tourActive,
    currentStep,
    currentStepData,
    totalSteps,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
  } = useTour();

  const [theme, setTheme] = useState<Theme>(() => loadSavedTheme());
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium');
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [summaryLevel, setSummaryLevel] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptSessionId, setTranscriptSessionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileTab, setMobileTab] = useState<'terminal' | 'controls' | 'history'>('terminal');

  // Apply theme on load and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  // Handle responsive breakpoint
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check API status on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/status`)
      .then((res) => res.json())
      .then((data) => setApiAvailable(data.apiAvailable))
      .catch(() => setApiAvailable(false));
  }, []);

  // Listen for socket events
  useEffect(() => {
    const handleSummaryStarted = () => {
      setIsSummarizing(true);
    };

    const handleSummaryResult = ({ text, level }: { text: string; level: string }) => {
      setCurrentSummary(text);
      setSummaryLevel(level);
      setIsSummarizing(false);
      toast.success('Summary generated');
    };

    const handleSummaryError = ({ error }: { error?: string }) => {
      setIsSummarizing(false);
      toast.error(error || 'Failed to generate summary');
    };

    const handleSessionSaved = () => {
      refreshSessions();
      toast.success('Session saved');
    };

    const handleSessionStarted = ({ type }: { type: string }) => {
      toast.info(`${type === 'ssh' ? 'SSH' : 'Local'} session started`);
    };

    const handleTerminalExit = () => {
      toast.info('Session ended');
    };

    const handleConnectError = () => {
      toast.error('Connection to server failed');
    };

    socket.on('summary:started', handleSummaryStarted);
    socket.on('summary:result', handleSummaryResult);
    socket.on('summary:error', handleSummaryError);
    socket.on('session:saved', handleSessionSaved);
    socket.on('session:started', handleSessionStarted);
    socket.on('terminal:exit', handleTerminalExit);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('summary:started', handleSummaryStarted);
      socket.off('summary:result', handleSummaryResult);
      socket.off('summary:error', handleSummaryError);
      socket.off('session:saved', handleSessionSaved);
      socket.off('session:started', handleSessionStarted);
      socket.off('terminal:exit', handleTerminalExit);
      socket.off('connect_error', handleConnectError);
    };
  }, [refreshSessions, toast]);

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

  // Auto-play: select session and immediately start speaking
  const handleAutoPlay = useCallback(
    async (session: Session) => {
      setSelectedSession(session);

      // Get existing summary or generate new one
      const existingSummary =
        detailLevel === 'high'
          ? session.summary_high
          : detailLevel === 'medium'
            ? session.summary_medium
            : session.summary_detailed;

      if (existingSummary) {
        setCurrentSummary(existingSummary);
        setSummaryLevel(detailLevel);
        // Auto-play after a brief delay to ensure state is set
        setTimeout(() => speak(existingSummary), 100);
      } else {
        // Generate new summary then play
        setIsSummarizing(true);
        try {
          const summary = await summarizeSession(session.id, detailLevel);
          setCurrentSummary(summary);
          setSummaryLevel(detailLevel);
          // Auto-play the generated summary
          setTimeout(() => speak(summary), 100);
        } catch {
          setCurrentSummary('Failed to generate summary');
        } finally {
          setIsSummarizing(false);
        }
      }
    },
    [detailLevel, summarizeSession, speak]
  );

  // Play a specific summary level from history
  const handlePlaySummary = useCallback(
    (session: Session, level: DetailLevel) => {
      setSelectedSession(session);

      const summaryMap = {
        high: session.summary_high,
        medium: session.summary_medium,
        detailed: session.summary_detailed,
      };

      const summary = summaryMap[level];
      if (summary) {
        setCurrentSummary(summary);
        setSummaryLevel(level);
        setTimeout(() => speak(summary), 100);
      }
    },
    [speak]
  );

  // View transcript modal
  const handleViewTranscript = useCallback(
    async (session: Session) => {
      setTranscriptSessionId(session.id);
      setShowTranscript(true);
      setTranscriptLoading(true);
      setTranscriptData(null);

      try {
        const sessionData = await getSession(session.id);
        setTranscriptData(sessionData?.transcript || null);
      } catch {
        toast.error('Failed to load transcript');
      } finally {
        setTranscriptLoading(false);
      }
    },
    [getSession, toast]
  );

  const handleEndSession = useCallback(() => {
    endSession();
    setCurrentSummary(null);
    setSummaryLevel(null);
  }, [endSession]);

  // Mobile tab navigation
  const MobileNav = () => (
    <div className="flex gap-1 mb-3 bg-theme-secondary p-1 rounded-lg">
      {[
        { id: 'terminal', label: 'Terminal', icon: '💻' },
        { id: 'controls', label: 'Controls', icon: '⚙️' },
        { id: 'history', label: 'History', icon: '📜' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setMobileTab(tab.id as typeof mobileTab)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mobileTab === tab.id
              ? 'btn-accent'
              : 'text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary'
          }`}
        >
          <span className="mr-1">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-screen max-h-screen bg-theme-primary text-theme-primary p-2 sm:p-3 flex flex-col overflow-hidden">
      <header className="mb-2 sm:mb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Claude Code Narrator</h1>
            <p className="text-theme-muted text-xs">
              Terminal session capture with AI-powered narration
            </p>
          </div>
          <button
            onClick={startTour}
            className="text-theme-muted hover:text-theme-primary text-xs px-2 py-1 rounded hover:bg-theme-tertiary transition-colors"
            title="Start product tour"
          >
            ?
          </button>
        </div>
        {apiAvailable === false && (
          <p className="text-warning text-xs sm:text-sm mt-1">
            No ANTHROPIC_API_KEY detected - using mock summaries
          </p>
        )}
      </header>

      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex-1 flex flex-col min-h-0">
          <MobileNav />
          <div className="flex-1 overflow-auto min-h-0">
            {mobileTab === 'terminal' && (
              <div className="flex flex-col gap-2">
                <div className="h-[180px] min-h-[150px]" data-tour="terminal">
                  <Terminal terminalRef={terminalRef} />
                </div>
                {sessionId && (
                  <div data-tour="quick-commands">
                    <QuickCommands onCommand={sendCommand} />
                  </div>
                )}
                <div data-tour="narration">
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
              </div>
            )}
            {mobileTab === 'controls' && (
              <div data-tour="controls">
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
                  ttsLoading={ttsLoading}
                  openaiAvailable={openaiAvailable}
                  currentTheme={theme}
                  onThemeChange={handleThemeChange}
                />
              </div>
            )}
            {mobileTab === 'history' && (
              <div data-tour="history">
                <TranscriptList
                  sessions={sessions}
                  loading={sessionsLoading}
                  onRefresh={refreshSessions}
                  onSelect={handleSelectSession}
                  onAutoPlay={handleAutoPlay}
                  onPlaySummary={handlePlaySummary}
                  onViewTranscript={handleViewTranscript}
                  onDelete={deleteSession}
                  selectedId={selectedSession?.id ?? null}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <PanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Main terminal area */}
          <Panel defaultSize={75} minSize={40}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={65} minSize={20}>
                <div className="h-full pr-2 pb-1 flex flex-col gap-2">
                  <div className="flex-1 min-h-0" data-tour="terminal">
                    <Terminal terminalRef={terminalRef} />
                  </div>
                  {sessionId && (
                    <div data-tour="quick-commands">
                      <QuickCommands onCommand={sendCommand} />
                    </div>
                  )}
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 flex items-center justify-center group cursor-row-resize">
                <div className="w-16 h-1 rounded-full bg-theme-tertiary group-hover:bg-[var(--accent-primary)] transition-colors" />
              </PanelResizeHandle>

              <Panel defaultSize={35} minSize={15}>
                <div className="h-full pr-2 pt-1 overflow-auto" data-tour="narration">
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
            <div className="h-16 w-1 rounded-full bg-theme-tertiary group-hover:bg-[var(--accent-primary)] transition-colors" />
          </PanelResizeHandle>

          {/* Sidebar */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full pl-2 flex flex-col gap-4 overflow-y-auto">
              <div data-tour="controls">
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
                  ttsLoading={ttsLoading}
                  openaiAvailable={openaiAvailable}
                  currentTheme={theme}
                  onThemeChange={handleThemeChange}
                />
              </div>
              <div data-tour="history">
                <TranscriptList
                  sessions={sessions}
                  loading={sessionsLoading}
                  onRefresh={refreshSessions}
                  onSelect={handleSelectSession}
                  onAutoPlay={handleAutoPlay}
                  onPlaySummary={handlePlaySummary}
                  onViewTranscript={handleViewTranscript}
                  onDelete={deleteSession}
                  selectedId={selectedSession?.id ?? null}
                />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      )}

      {/* Footer */}
      <footer className="mt-2 py-2 border-t border-theme shrink-0">
        <div className="flex items-center justify-between text-xs text-theme-muted">
          <button
            onClick={() => setShowChangelog(true)}
            className="hover:text-[var(--accent-primary)] transition-colors font-mono"
          >
            v{APP_VERSION}
          </button>
          <div className="text-center hidden sm:block">
            Powered by{' '}
            <span className="text-[var(--accent-primary)] font-medium">Ecoworks Web Architecture</span>
          </div>
          <div className="text-theme-muted">
            &copy; {new Date().getFullYear()} Ecoworks
          </div>
        </div>
      </footer>

      {/* Changelog Modal */}
      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

      {/* Transcript Modal */}
      <TranscriptModal
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        transcript={transcriptData}
        sessionId={transcriptSessionId}
        isLoading={transcriptLoading}
      />

      {/* Product Tour */}
      <ProductTour
        isActive={tourActive}
        currentStep={currentStep}
        currentStepData={currentStepData}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={() => endTour(true)}
        onGoToStep={goToStep}
      />
    </div>
  );
}

export default App;
