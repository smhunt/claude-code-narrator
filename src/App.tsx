import { useState, useEffect, useCallback, useMemo } from 'react';
import { SplitPaneTerminals } from './components/SplitPaneTerminals';
import { SessionTabs } from './components/SessionTabs';
import { useSplitLayout } from './hooks/useSplitLayout';
import { QuickCommands } from './components/QuickCommands';
import { AppHeader } from './components/AppHeader';
import { SettingsModal } from './components/SettingsModal';
import { SideDrawer } from './components/SideDrawer';
import { ChangelogModal, APP_VERSION } from './components/ChangelogModal';
import { TranscriptModal } from './components/TranscriptModal';
import { ProductTour } from './components/ProductTour';
import { SplitTerminalGuide } from './components/SplitTerminalGuide';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useMultiTerminal } from './hooks/useMultiTerminal';
import { useTTS } from './hooks/useTTS';
import { useTranscripts, type Session, type TranscriptData } from './hooks/useTranscripts';
import { useTour } from './hooks/useTour';
import { useKeyboardShortcuts, type KeyboardShortcutActions } from './hooks/useKeyboardShortcuts';
import { useVoiceProfiles } from './hooks/useVoiceProfiles';
import { socket, BACKEND_URL } from './lib/socket';
import { useToast } from './components/Toast';
import { loadSavedTheme, applyTheme, type Theme } from './lib/themes';
import { sessionToMarkdown, downloadMarkdown, generateFilename } from './lib/exportMarkdown';
import type { SSHPreset } from './lib/sshPresets';

type DetailLevel = 'high' | 'medium' | 'detailed';

function App() {
  const {
    sessions: terminalSessions,
    activeSessionId,
    setActiveSession,
    createSession,
    closeSession,
    renameSession,
    startLocalSession,
    startSSHSession,
    endSession,
    requestSummary,
    sendCommand,
    mountTerminal,
    unmountTerminal,
    getActiveSession,
  } = useMultiTerminal();

  const activeSession = getActiveSession();

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
    profiles: voiceProfiles,
    activeProfileId,
    saveProfile,
    loadProfile,
    deleteProfile,
    renameProfile,
    updateProfile,
    setActiveProfile,
  } = useVoiceProfiles();

  // Split pane layout
  const {
    layout: splitLayout,
    isSplit,
    enableSplit,
    disableSplit,
    setPrimaryPane,
    setSecondaryPane,
    swapPanes,
    setFocusedPane,
    setSizes,
  } = useSplitLayout(activeSessionId);

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

  // UI State
  const [theme, setTheme] = useState<Theme>(() => loadSavedTheme());
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium');
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [summaryLevel, setSummaryLevel] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Modal/Drawer State
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSplitGuide, setShowSplitGuide] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptSessionId, setTranscriptSessionId] = useState<string | null>(null);

  // Apply theme on load and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
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

  // Handle new terminal session
  const handleNewSession = useCallback(() => {
    createSession();
  }, [createSession]);

  // Handle start local session
  const handleStartSession = useCallback(async (config?: { defaultDir?: string; initialCommand?: string }) => {
    let tabId = activeSessionId;

    // Create a new tab if none exists or current has a session
    if (!tabId || activeSession?.sessionId) {
      tabId = createSession();
    }

    await startLocalSession(tabId, config);
  }, [activeSessionId, activeSession, createSession, startLocalSession]);

  // Handle start SSH session
  const handleStartSSHSession = useCallback(async (config: {
    host: string;
    user?: string;
    port?: number;
    defaultDir?: string;
    initialCommand?: string;
  }) => {
    let tabId = activeSessionId;

    // Create a new tab if none exists or current has a session
    if (!tabId || activeSession?.sessionId) {
      tabId = createSession();
    }

    await startSSHSession(tabId, config);
  }, [activeSessionId, activeSession, createSession, startSSHSession]);

  // Handle end session
  const handleEndSession = useCallback(() => {
    if (activeSessionId) {
      endSession(activeSessionId);
      setCurrentSummary(null);
      setSummaryLevel(null);
    }
  }, [activeSessionId, endSession]);

  // Handle summarize
  const handleSummarize = useCallback((level: DetailLevel) => {
    if (activeSessionId && activeSession?.sessionId) {
      requestSummary(activeSessionId, level);
    }
  }, [activeSessionId, activeSession, requestSummary]);

  // Handle send command
  const handleSendCommand = useCallback((command: string) => {
    if (activeSessionId && activeSession?.sessionId) {
      sendCommand(activeSessionId, command);
    }
  }, [activeSessionId, activeSession, sendCommand]);

  // Export Claude transcript and summarize
  const handleClaudeExport = useCallback(async () => {
    if (!activeSessionId || !activeSession?.sessionId) return;

    const exportFilePath = `/tmp/narrator-claude-export.txt`;

    sendCommand(activeSessionId, `/export ${exportFilePath}\r`);
    toast.info('Exporting Claude transcript...');
    setIsSummarizing(true);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const response = await fetch(`${BACKEND_URL}/api/claude-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: exportFilePath,
          level: detailLevel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to summarize Claude export');
      }

      const data = await response.json();
      setCurrentSummary(data.summary);
      setSummaryLevel(detailLevel);
      toast.success(`Claude transcript summarized (${data.chars} chars)`);
    } catch (error) {
      console.error('Claude export error:', error);
      toast.error('Make sure Claude Code is running in the terminal');
    } finally {
      setIsSummarizing(false);
    }
  }, [activeSessionId, activeSession, sendCommand, detailLevel, toast]);

  const handleSelectSession = useCallback(
    async (session: Session) => {
      setSelectedSession(session);

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

  const handleAutoPlay = useCallback(
    async (session: Session) => {
      setSelectedSession(session);

      const existingSummary =
        detailLevel === 'high'
          ? session.summary_high
          : detailLevel === 'medium'
            ? session.summary_medium
            : session.summary_detailed;

      if (existingSummary) {
        setCurrentSummary(existingSummary);
        setSummaryLevel(detailLevel);
        setTimeout(() => speak(existingSummary), 100);
      } else {
        setIsSummarizing(true);
        try {
          const summary = await summarizeSession(session.id, detailLevel);
          setCurrentSummary(summary);
          setSummaryLevel(detailLevel);
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
        toast.info('Playing narration...');
        setTimeout(() => speak(summary), 100);
      }
    },
    [speak, toast]
  );

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

  // Export session to markdown
  const handleExportMarkdown = useCallback(
    async (session: Session) => {
      try {
        toast.info('Preparing export...');
        const sessionData = await getSession(session.id);
        const markdown = sessionToMarkdown(session, sessionData?.transcript || null);
        const filename = generateFilename(session);
        downloadMarkdown(markdown, filename);
        toast.success(`Exported to ${filename}`);
      } catch {
        toast.error('Failed to export session');
      }
    },
    [getSession, toast]
  );

  // Reconnect to tmux session from history
  const handleReconnect = useCallback(
    (session: Session) => {
      if (!session.tmux_session) return;

      const tabId = createSession();
      const attachCommand = `tmux attach -t ${session.tmux_session}`;

      if (session.ssh_host) {
        // SSH reconnect: parse user@host format
        const [user, host] = session.ssh_host.includes('@')
          ? session.ssh_host.split('@')
          : [undefined, session.ssh_host];

        startSSHSession(tabId, {
          host: host || session.ssh_host,
          user,
          initialCommand: attachCommand,
        });
        toast.info(`Reconnecting to tmux:${session.tmux_session} via ${session.ssh_host}`);
      } else {
        // Local reconnect
        startLocalSession(tabId, {
          initialCommand: attachCommand,
        });
        toast.info(`Reconnecting to tmux:${session.tmux_session}`);
      }

      setShowDrawer(false);
    },
    [createSession, startSSHSession, startLocalSession, toast]
  );

  // Split pane handlers
  const handleSplitHorizontal = useCallback(() => {
    enableSplit('horizontal', activeSessionId || terminalSessions[0]?.id || '', null);
  }, [enableSplit, activeSessionId, terminalSessions]);

  const handleSplitVertical = useCallback(() => {
    enableSplit('vertical', activeSessionId || terminalSessions[0]?.id || '', null);
  }, [enableSplit, activeSessionId, terminalSessions]);

  const handleSelectTerminalForPane = useCallback((pane: 'primary' | 'secondary', terminalId: string) => {
    if (pane === 'primary') {
      setPrimaryPane(terminalId);
    } else {
      setSecondaryPane(terminalId);
    }
  }, [setPrimaryPane, setSecondaryPane]);

  // Keep primary pane in sync with active session when not in split mode
  useEffect(() => {
    if (!isSplit && activeSessionId && splitLayout.primaryPaneId !== activeSessionId) {
      setPrimaryPane(activeSessionId);
    }
  }, [isSplit, activeSessionId, splitLayout.primaryPaneId, setPrimaryPane]);

  // Voice profile handlers
  const handleSaveVoiceProfile = useCallback((name: string) => {
    const profile = saveProfile(name, ttsSettings);
    setActiveProfile(profile.id);
    toast.success(`Profile "${name}" saved`);
  }, [saveProfile, ttsSettings, setActiveProfile, toast]);

  const handleLoadVoiceProfile = useCallback((id: string) => {
    const settings = loadProfile(id);
    if (settings) {
      updateTTSSettings(settings);
      setActiveProfile(id);
    }
  }, [loadProfile, updateTTSSettings, setActiveProfile]);

  const handleDeleteVoiceProfile = useCallback((id: string) => {
    deleteProfile(id);
    toast.info('Profile deleted');
  }, [deleteProfile, toast]);

  const handleUpdateVoiceProfile = useCallback((id: string) => {
    updateProfile(id, ttsSettings);
    toast.success('Profile updated');
  }, [updateProfile, ttsSettings, toast]);

  const handleRenameVoiceProfile = useCallback((id: string, newName: string) => {
    renameProfile(id, newName);
  }, [renameProfile]);

  // Connect via preset and auto-focus terminal
  const handleConnectPreset = useCallback((preset: SSHPreset) => {
    handleStartSSHSession({
      host: preset.host,
      user: preset.user,
      port: preset.port,
      defaultDir: preset.defaultDir,
      initialCommand: preset.initialCommand,
    });
    setShowSettings(false);
  }, [handleStartSSHSession]);

  // Keyboard shortcut actions
  const keyboardActions: KeyboardShortcutActions = useMemo(() => ({
    newTab: () => {
      createSession();
    },
    closeTab: () => {
      if (activeSessionId) {
        closeSession(activeSessionId);
      }
    },
    nextTab: () => {
      if (!activeSessionId || terminalSessions.length <= 1) return;
      const currentIndex = terminalSessions.findIndex(s => s.id === activeSessionId);
      const nextIndex = (currentIndex + 1) % terminalSessions.length;
      setActiveSession(terminalSessions[nextIndex].id);
    },
    prevTab: () => {
      if (!activeSessionId || terminalSessions.length <= 1) return;
      const currentIndex = terminalSessions.findIndex(s => s.id === activeSessionId);
      const prevIndex = (currentIndex - 1 + terminalSessions.length) % terminalSessions.length;
      setActiveSession(terminalSessions[prevIndex].id);
    },
    goToTab: (index: number) => {
      if (index >= 0 && index < terminalSessions.length) {
        setActiveSession(terminalSessions[index].id);
      }
    },
    togglePlayPause: () => {
      if (isSpeaking) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
      } else if (currentSummary) {
        speak(currentSummary);
      }
    },
    stopPlayback: () => {
      stop();
    },
    toggleSettings: () => {
      setShowSettings(prev => !prev);
    },
    toggleHistory: () => {
      setShowDrawer(prev => !prev);
    },
    showShortcutsHelp: () => {
      setShowShortcuts(true);
    },
    focusTerminal: () => {
      // Focus the active terminal
      const session = terminalSessions.find(s => s.id === activeSessionId);
      if (session?.terminal) {
        session.terminal.focus();
      }
    },
  }), [
    activeSessionId,
    terminalSessions,
    createSession,
    closeSession,
    setActiveSession,
    isSpeaking,
    isPaused,
    currentSummary,
    speak,
    pause,
    resume,
    stop,
  ]);

  // Register keyboard shortcuts
  useKeyboardShortcuts(keyboardActions, {
    enabled: !tourActive, // Disable during product tour
  });

  return (
    <div className="h-screen max-h-screen bg-theme-primary text-theme-primary flex flex-col overflow-hidden">
      {/* App Header with controls */}
      <AppHeader
        isConnected={!!activeSession?.isConnected}
        sessionId={activeSession?.sessionId ?? null}
        sessionType={activeSession?.sessionType ?? null}
        onStartSession={handleStartSession}
        onStartSSHSession={handleStartSSHSession}
        onEndSession={handleEndSession}
        detailLevel={detailLevel}
        onDetailLevelChange={setDetailLevel}
        onSummarize={handleSummarize}
        onClaudeExport={handleClaudeExport}
        isSummarizing={isSummarizing}
        hasSummary={!!currentSummary}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        onSpeak={handleSpeak}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDrawer={() => setShowDrawer(true)}
      />

      {/* API Warning */}
      {apiAvailable === false && (
        <div className="px-3 py-1 bg-yellow-900/50 text-yellow-300 text-xs text-center">
          No ANTHROPIC_API_KEY detected - using mock summaries
        </div>
      )}

      {/* Session Tabs */}
      <SessionTabs
        sessions={terminalSessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSession}
        onCloseSession={closeSession}
        onRenameSession={renameSession}
        onNewSession={handleNewSession}
        onOpenSplitGuide={() => setShowSplitGuide(true)}
        isSplit={isSplit}
        splitDirection={splitLayout.direction}
        onSplitHorizontal={handleSplitHorizontal}
        onSplitVertical={handleSplitVertical}
        onExitSplit={disableSplit}
        onSwapPanes={swapPanes}
      />

      {/* Main Content: Terminal + Side Drawer */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Terminal Area */}
        <div className="flex-1 flex flex-col min-h-0 max-h-full p-2 sm:p-3 gap-2 overflow-hidden">
          {/* Terminal */}
          <div className="flex-1 min-h-0 max-h-full overflow-hidden" data-tour="terminal">
            <SplitPaneTerminals
              sessions={terminalSessions}
              layout={splitLayout}
              onMount={mountTerminal}
              onUnmount={unmountTerminal}
              onFocusPane={setFocusedPane}
              onSizesChange={setSizes}
              onSelectTerminalForPane={handleSelectTerminalForPane}
            />
          </div>

          {/* Quick Commands */}
          {activeSession?.sessionId && (
            <div data-tour="quick-commands">
              <QuickCommands onCommand={handleSendCommand} />
            </div>
          )}
        </div>

        {/* Side Drawer - inline, not overlay */}
        <SideDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          onRefreshSessions={refreshSessions}
          onSelectSession={handleSelectSession}
          onAutoPlay={handleAutoPlay}
          onPlaySummary={handlePlaySummary}
          onViewTranscript={handleViewTranscript}
          onExportMarkdown={handleExportMarkdown}
          onDeleteSession={deleteSession}
          onReconnect={handleReconnect}
          selectedSessionId={selectedSession?.id ?? null}
          summary={currentSummary}
          summaryLevel={summaryLevel}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          onSpeak={handleSpeak}
          onStop={stop}
          onPause={pause}
          onResume={resume}
        />
      </main>

      {/* Footer */}
      <footer className="px-3 py-2 border-t border-theme shrink-0 flex items-center justify-between text-xs text-theme-muted">
        <button
          onClick={() => setShowChangelog(true)}
          className="hover:text-[var(--accent-primary)] transition-colors font-mono"
        >
          v{APP_VERSION}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcuts(true)}
            className="hover:text-[var(--accent-primary)] transition-colors px-1.5 py-0.5 bg-theme-secondary rounded text-[10px] font-mono"
            title="Keyboard shortcuts (Cmd+/)"
          >
            ?
          </button>
          <button
            onClick={startTour}
            className="hover:text-[var(--accent-primary)] transition-colors"
            title="Start product tour"
          >
            Help
          </button>
        </div>
        <span className="hidden sm:inline">
          Powered by <span className="text-[var(--accent-primary)]">Ecoworks</span>
        </span>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        ttsSettings={ttsSettings}
        onTTSSettingsChange={updateTTSSettings}
        voices={voices}
        ttsLoading={ttsLoading}
        openaiAvailable={openaiAvailable}
        voiceProfiles={voiceProfiles}
        activeProfileId={activeProfileId}
        onSaveProfile={handleSaveVoiceProfile}
        onLoadProfile={handleLoadVoiceProfile}
        onDeleteProfile={handleDeleteVoiceProfile}
        onUpdateProfile={handleUpdateVoiceProfile}
        onRenameProfile={handleRenameVoiceProfile}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        onConnectPreset={handleConnectPreset}
        isConnected={!!activeSession?.sessionId}
      />

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

      {/* Split Terminal Guide */}
      <SplitTerminalGuide
        isOpen={showSplitGuide}
        onClose={() => setShowSplitGuide(false)}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
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
