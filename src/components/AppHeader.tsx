import { useState } from 'react';
import type { SSHConfig } from '../hooks/useTerminal';

type DetailLevel = 'high' | 'medium' | 'detailed';

interface AppHeaderProps {
  // Session
  isConnected: boolean;
  sessionId: string | null;
  sessionType: 'local' | 'ssh' | null;
  onStartSession: () => void;
  onStartSSHSession: (config: SSHConfig) => void;
  onEndSession: () => void;
  // Summarization
  detailLevel: DetailLevel;
  onDetailLevelChange: (level: DetailLevel) => void;
  onSummarize: (level: DetailLevel) => void;
  isSummarizing: boolean;
  hasSummary: boolean;
  // Playback
  isSpeaking: boolean;
  isPaused: boolean;
  onSpeak: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  // UI
  onOpenSettings: () => void;
  onOpenDrawer: () => void;
}

export function AppHeader({
  isConnected,
  sessionId,
  sessionType,
  onStartSession,
  onStartSSHSession,
  onEndSession,
  detailLevel,
  onDetailLevelChange,
  onSummarize,
  isSummarizing,
  hasSummary,
  isSpeaking,
  isPaused,
  onSpeak,
  onPause,
  onResume,
  onStop,
  onOpenSettings,
  onOpenDrawer,
}: AppHeaderProps) {
  const [showSSHForm, setShowSSHForm] = useState(false);
  const [sshConfig, setSSHConfig] = useState<SSHConfig>({
    host: '',
    user: '',
    port: 22,
  });

  const handleSSHConnect = () => {
    onStartSSHSession(sshConfig);
    setShowSSHForm(false);
  };

  const detailLabels: Record<DetailLevel, string> = {
    high: 'B',
    medium: 'S',
    detailed: 'D',
  };

  return (
    <header className="bg-theme-secondary border-b border-theme">
      {/* Main header row */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Left: Session controls */}
        <div className="flex items-center gap-1">
          {sessionId ? (
            <>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                sessionType === 'ssh' ? 'bg-blue-600' : 'bg-green-600'
              } text-white`}>
                {sessionType === 'ssh' ? 'SSH' : 'Local'}
              </span>
              <button
                onClick={onEndSession}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
              >
                End
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartSession}
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
              >
                Local
              </button>
              <button
                onClick={() => setShowSSHForm(!showSSHForm)}
                className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                  showSSHForm ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                SSH
              </button>
            </>
          )}
          {/* Connection indicator */}
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>

        {/* Center: Detail level + Summarize */}
        <div className="flex items-center gap-1">
          {(['high', 'medium', 'detailed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onDetailLevelChange(level)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                detailLevel === level
                  ? 'btn-accent'
                  : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
              }`}
              title={level === 'high' ? 'Brief' : level === 'medium' ? 'Standard' : 'Detailed'}
            >
              {detailLabels[level]}
            </button>
          ))}
          {sessionId && (
            <button
              onClick={() => onSummarize(detailLevel)}
              disabled={isSummarizing}
              className="px-2 py-1 btn-accent text-xs rounded disabled:opacity-50"
              title="Summarize"
            >
              {isSummarizing ? '...' : '∑'}
            </button>
          )}
        </div>

        {/* Right: Playback + Menu */}
        <div className="flex items-center gap-1">
          {/* Playback controls */}
          {hasSummary && (
            <>
              {!isSpeaking ? (
                <button
                  onClick={onSpeak}
                  className="w-8 h-8 rounded bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-colors"
                  title="Play"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              ) : isPaused ? (
                <button
                  onClick={onResume}
                  className="w-8 h-8 rounded bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-colors"
                  title="Resume"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="w-8 h-8 rounded bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition-colors"
                  title="Pause"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </button>
              )}
              {isSpeaking && (
                <button
                  onClick={onStop}
                  className="w-8 h-8 rounded bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                  title="Stop"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Speaking indicator */}
          {isSpeaking && !isPaused && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded bg-theme-tertiary hover:bg-theme-primary text-theme-secondary hover:text-theme-primary flex items-center justify-center transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Drawer toggle */}
          <button
            onClick={onOpenDrawer}
            className="w-8 h-8 rounded bg-theme-tertiary hover:bg-theme-primary text-theme-secondary hover:text-theme-primary flex items-center justify-center transition-colors"
            title="History & Narration"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* SSH Form (expandable) */}
      {showSSHForm && !sessionId && (
        <div className="px-3 pb-3 border-t border-theme pt-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-theme-muted mb-1">Host</label>
              <input
                type="text"
                value={sshConfig.host}
                onChange={(e) => setSSHConfig({ ...sshConfig, host: e.target.value })}
                className="w-full px-2 py-1 bg-theme-tertiary text-theme-primary rounded text-sm border border-theme"
                placeholder="hostname"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-theme-muted mb-1">User</label>
              <input
                type="text"
                value={sshConfig.user || ''}
                onChange={(e) => setSSHConfig({ ...sshConfig, user: e.target.value })}
                className="w-full px-2 py-1 bg-theme-tertiary text-theme-primary rounded text-sm border border-theme"
                placeholder="user"
              />
            </div>
            <div className="w-16">
              <label className="block text-xs text-theme-muted mb-1">Port</label>
              <input
                type="number"
                value={sshConfig.port || 22}
                onChange={(e) => setSSHConfig({ ...sshConfig, port: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-theme-tertiary text-theme-primary rounded text-sm border border-theme"
              />
            </div>
            <button
              onClick={handleSSHConnect}
              className="px-3 py-1 btn-accent text-sm rounded"
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
