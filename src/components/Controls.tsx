import { useState } from 'react';
import type { TTSSettings } from '../hooks/useTTS';
import type { SSHConfig } from '../hooks/useTerminal';

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
}: ControlsProps) {
  const [showSSH, setShowSSH] = useState(false);
  const [sshConfig, setSSHConfig] = useState<SSHConfig>({
    host: '10.10.10.24',
    user: 'seanhunt',
    port: 22,
  });

  const handleSSHConnect = () => {
    onStartSSHSession(sshConfig);
    setShowSSH(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Session</h2>
        {sessionId ? (
          <button
            onClick={onEndSession}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            End Session
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onStartSession}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              Local
            </button>
            <button
              onClick={() => setShowSSH(!showSSH)}
              className={`px-3 py-2 text-white rounded-lg transition-colors text-sm ${
                showSSH ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              SSH
            </button>
          </div>
        )}
      </div>

      {/* SSH Connection Form */}
      {showSSH && !sessionId && (
        <div className="bg-gray-900 rounded-lg p-3 space-y-3">
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Host</label>
            <input
              type="text"
              value={sshConfig.host}
              onChange={(e) => setSSHConfig({ ...sshConfig, host: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
              placeholder="10.10.10.24"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="block text-xs text-gray-400">User</label>
              <input
                type="text"
                value={sshConfig.user || ''}
                onChange={(e) => setSSHConfig({ ...sshConfig, user: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-gray-400">Port</label>
              <input
                type="number"
                value={sshConfig.port || 22}
                onChange={(e) => setSSHConfig({ ...sshConfig, port: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSSHConnect}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            Connect via SSH
          </button>
        </div>
      )}

      {/* Session Info */}
      {sessionId && (
        <div className="text-sm text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs ${
              sessionType === 'ssh' ? 'bg-blue-800' : 'bg-green-800'
            }`}>
              {sessionType === 'ssh' ? 'SSH' : 'Local'}
            </span>
            <span className="truncate">{sessionId.slice(0, 8)}...</span>
          </div>
          {sshHost && (
            <div className="text-xs text-blue-400">
              Connected to {sshHost}
            </div>
          )}
        </div>
      )}

      {!sessionId && !showSSH && isConnected && (
        <div className="text-sm text-gray-400">
          Connected, no active session
        </div>
      )}

      <hr className="border-gray-700" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Narration Detail</h3>
        <div className="flex gap-2">
          {(['high', 'medium', 'detailed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onDetailLevelChange(level)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                detailLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {level === 'high' ? 'Brief' : level === 'medium' ? 'Standard' : 'Detailed'}
            </button>
          ))}
        </div>

        <button
          onClick={() => onSummarize(detailLevel)}
          disabled={!sessionId || isSummarizing}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isSummarizing ? 'Summarizing...' : 'Summarize Now'}
        </button>
      </div>

      <hr className="border-gray-700" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Voice Settings</h3>

        <div className="space-y-2">
          <label className="block text-xs text-gray-400">Voice</label>
          <select
            value={ttsSettings.voiceIndex}
            onChange={(e) => onTTSSettingsChange({ voiceIndex: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
          >
            {voices.map((voice, idx) => (
              <option key={idx} value={idx}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-gray-400">
            Speed: {ttsSettings.rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={ttsSettings.rate}
            onChange={(e) => onTTSSettingsChange({ rate: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-gray-400">
            Pitch: {ttsSettings.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={ttsSettings.pitch}
            onChange={(e) => onTTSSettingsChange({ pitch: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-gray-400">
            Volume: {Math.round(ttsSettings.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ttsSettings.volume}
            onChange={(e) => onTTSSettingsChange({ volume: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
