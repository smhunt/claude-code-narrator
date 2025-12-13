import { useState } from 'react';
import type { TTSSettings } from '../hooks/useTTS';
import type { SSHConfig } from '../hooks/useTerminal';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { Theme } from '../lib/themes';

interface ControlsProps {
  isConnected: boolean;
  sessionId: string | null;
  sessionType: 'local' | 'ssh' | null;
  sshHost: string | null;
  onStartSession: () => void;
  onStartSSHSession: (config: SSHConfig) => void;
  onEndSession: () => void;
  onSummarize: (level: 'high' | 'medium' | 'detailed') => void;
  detailLevel: 'high' | 'medium' | 'detailed';
  onDetailLevelChange: (level: 'high' | 'medium' | 'detailed') => void;
  ttsSettings: TTSSettings;
  onTTSSettingsChange: (settings: Partial<TTSSettings>) => void;
  voices: SpeechSynthesisVoice[];
  isSummarizing: boolean;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function Controls({
  isConnected,
  sessionId,
  sessionType,
  sshHost,
  onStartSession,
  onStartSSHSession,
  onEndSession,
  onSummarize,
  detailLevel,
  onDetailLevelChange,
  ttsSettings,
  onTTSSettingsChange,
  voices,
  isSummarizing,
  currentTheme,
  onThemeChange,
}: ControlsProps) {
  const [showSSH, setShowSSH] = useState(false);
  const [sshConfig, setSSHConfig] = useState<SSHConfig>({
    host: '',
    user: '',
    port: 22,
  });

  const handleSSHConnect = () => {
    onStartSSHSession(sshConfig);
    setShowSSH(false);
  };

  return (
    <div className="bg-theme-secondary rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-theme-primary">Session</h2>
        {sessionId ? (
          <button
            onClick={onEndSession}
            className="px-4 py-2 btn-danger rounded-lg transition-colors"
          >
            End Session
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onStartSession}
              className="px-3 py-2 btn-success rounded-lg transition-colors text-sm"
            >
              Local
            </button>
            <button
              onClick={() => setShowSSH(!showSSH)}
              className={`px-3 py-2 text-white rounded-lg transition-colors text-sm ${
                showSSH ? 'btn-accent opacity-80' : 'btn-accent hover:opacity-90'
              }`}
            >
              SSH
            </button>
          </div>
        )}
      </div>

      {/* SSH Connection Form */}
      {showSSH && !sessionId && (
        <div className="bg-theme-primary rounded-lg p-3 space-y-3">
          <div className="space-y-2">
            <label className="block text-xs text-theme-muted">Host</label>
            <input
              type="text"
              value={sshConfig.host}
              onChange={(e) => setSSHConfig({ ...sshConfig, host: e.target.value })}
              className="w-full px-3 py-2 bg-theme-tertiary text-theme-primary rounded-lg text-sm border border-theme"
              placeholder="hostname or IP"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="block text-xs text-theme-muted">User</label>
              <input
                type="text"
                value={sshConfig.user || ''}
                onChange={(e) => setSSHConfig({ ...sshConfig, user: e.target.value })}
                className="w-full px-3 py-2 bg-theme-tertiary text-theme-primary rounded-lg text-sm border border-theme"
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-theme-muted">Port</label>
              <input
                type="number"
                value={sshConfig.port || 22}
                onChange={(e) => setSSHConfig({ ...sshConfig, port: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-theme-tertiary text-theme-primary rounded-lg text-sm border border-theme"
              />
            </div>
          </div>
          <button
            onClick={handleSSHConnect}
            className="w-full px-4 py-2 btn-accent rounded-lg transition-colors text-sm"
          >
            Connect via SSH
          </button>
        </div>
      )}

      {/* Session Info */}
      {sessionId && (
        <div className="text-sm text-theme-secondary space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs text-white ${
              sessionType === 'ssh' ? 'btn-accent' : 'btn-success'
            }`}>
              {sessionType === 'ssh' ? 'SSH' : 'Local'}
            </span>
            <span className="truncate text-theme-muted">{sessionId.slice(0, 8)}...</span>
          </div>
          {sshHost && (
            <div className="text-xs" style={{ color: 'var(--accent-primary)' }}>
              Connected to {sshHost}
            </div>
          )}
        </div>
      )}

      {!sessionId && !showSSH && isConnected && (
        <div className="text-sm text-theme-muted">
          Connected, no active session
        </div>
      )}

      <hr className="border-theme" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-theme-secondary">Narration Detail</h3>
        <div className="flex gap-2">
          {(['high', 'medium', 'detailed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onDetailLevelChange(level)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                detailLevel === level
                  ? 'btn-accent'
                  : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
              }`}
            >
              {level === 'high' ? 'Brief' : level === 'medium' ? 'Standard' : 'Detailed'}
            </button>
          ))}
        </div>

        <button
          onClick={() => onSummarize(detailLevel)}
          disabled={!sessionId || isSummarizing}
          className="w-full px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: !sessionId || isSummarizing ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
            color: !sessionId || isSummarizing ? 'var(--text-muted)' : 'var(--accent-text)',
          }}
        >
          {isSummarizing ? 'Summarizing...' : 'Summarize Now'}
        </button>
      </div>

      <hr className="border-theme" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-theme-secondary">Voice Settings</h3>

        <div className="space-y-2">
          <label className="block text-xs text-theme-muted">Voice</label>
          <select
            value={ttsSettings.voiceIndex}
            onChange={(e) => onTTSSettingsChange({ voiceIndex: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-theme-tertiary text-theme-primary rounded-lg text-sm border border-theme"
          >
            {voices.map((voice, idx) => (
              <option key={idx} value={idx}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-theme-muted">
            Speed: {ttsSettings.rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={ttsSettings.rate}
            onChange={(e) => onTTSSettingsChange({ rate: Number(e.target.value) })}
            className="w-full accent-[var(--accent-primary)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-theme-muted">
            Pitch: {ttsSettings.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={ttsSettings.pitch}
            onChange={(e) => onTTSSettingsChange({ pitch: Number(e.target.value) })}
            className="w-full accent-[var(--accent-primary)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-theme-muted">
            Volume: {Math.round(ttsSettings.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ttsSettings.volume}
            onChange={(e) => onTTSSettingsChange({ volume: Number(e.target.value) })}
            className="w-full accent-[var(--accent-primary)]"
          />
        </div>
      </div>

      <hr className="border-theme" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-theme-secondary">Theme</h3>
        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />
      </div>
    </div>
  );
}
