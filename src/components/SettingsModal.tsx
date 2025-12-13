import { useState, useEffect } from 'react';
import type { TTSSettings, OpenAIVoice } from '../hooks/useTTS';
import { OPENAI_VOICES } from '../hooks/useTTS';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { Theme } from '../lib/themes';
import { loadSSHPresets, saveSSHPresets, type SSHPreset } from '../lib/sshPresets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // TTS
  ttsSettings: TTSSettings;
  onTTSSettingsChange: (settings: Partial<TTSSettings>) => void;
  voices: SpeechSynthesisVoice[];
  ttsLoading: boolean;
  openaiAvailable: boolean;
  // Theme
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  ttsSettings,
  onTTSSettingsChange,
  voices,
  ttsLoading,
  openaiAvailable,
  currentTheme,
  onThemeChange,
}: SettingsModalProps) {
  const [presets, setPresets] = useState<SSHPreset[]>([]);
  const [editingPreset, setEditingPreset] = useState<SSHPreset | null>(null);

  // Load presets when modal opens
  useEffect(() => {
    if (isOpen) {
      setPresets(loadSSHPresets());
    }
  }, [isOpen]);

  const handleSavePreset = (preset: SSHPreset) => {
    const updated = presets.map(p => p.id === preset.id ? preset : p);
    setPresets(updated);
    saveSSHPresets(updated);
    setEditingPreset(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-theme-secondary rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden border border-theme">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-tertiary rounded-lg transition-colors text-theme-secondary hover:text-theme-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
          {/* Voice Settings Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Voice Settings
            </h3>

            {/* TTS Provider Toggle */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-xs text-theme-muted">TTS Engine</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onTTSSettingsChange({ provider: 'browser' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      ttsSettings.provider === 'browser'
                        ? 'btn-accent'
                        : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    Browser
                  </button>
                  <button
                    onClick={() => onTTSSettingsChange({ provider: 'openai' })}
                    disabled={!openaiAvailable}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      ttsSettings.provider === 'openai'
                        ? 'btn-accent'
                        : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                    } ${!openaiAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!openaiAvailable ? 'Add OPENAI_API_KEY to .env' : 'OpenAI TTS'}
                  >
                    OpenAI
                  </button>
                </div>
                {ttsLoading && (
                  <div className="text-xs text-theme-muted">Generating audio...</div>
                )}
              </div>

              {/* Browser TTS Settings */}
              {ttsSettings.provider === 'browser' && (
                <>
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
                </>
              )}

              {/* OpenAI TTS Settings */}
              {ttsSettings.provider === 'openai' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs text-theme-muted">Voice</label>
                    <select
                      value={ttsSettings.openaiVoice}
                      onChange={(e) => onTTSSettingsChange({ openaiVoice: e.target.value as OpenAIVoice })}
                      className="w-full px-3 py-2 bg-theme-tertiary text-theme-primary rounded-lg text-sm border border-theme"
                    >
                      {OPENAI_VOICES.map((voice) => (
                        <option key={voice.value} value={voice.value}>
                          {voice.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-theme-muted">
                      Speed: {ttsSettings.openaiSpeed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.25"
                      value={ttsSettings.openaiSpeed}
                      onChange={(e) => onTTSSettingsChange({ openaiSpeed: Number(e.target.value) })}
                      className="w-full accent-[var(--accent-primary)]"
                    />
                  </div>
                </>
              )}

              {/* Shared: Volume */}
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
          </section>

          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Theme
            </h3>
            <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />
          </section>

          {/* Connection Presets Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Connection Presets
            </h3>

            <div className="space-y-3">
              {presets.map((preset) => (
                <div key={preset.id} className="bg-theme-tertiary rounded-lg p-3">
                  {editingPreset?.id === preset.id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingPreset.name}
                          onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                          className="flex-1 px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                          placeholder="Name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingPreset.user}
                          onChange={(e) => setEditingPreset({ ...editingPreset, user: e.target.value })}
                          className="w-24 px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                          placeholder="User"
                        />
                        <input
                          type="text"
                          value={editingPreset.host}
                          onChange={(e) => setEditingPreset({ ...editingPreset, host: e.target.value })}
                          className="flex-1 px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                          placeholder="Host"
                        />
                        <input
                          type="number"
                          value={editingPreset.port}
                          onChange={(e) => setEditingPreset({ ...editingPreset, port: Number(e.target.value) })}
                          className="w-16 px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-theme-muted mb-1">Default Directory</label>
                        <input
                          type="text"
                          value={editingPreset.defaultDir || ''}
                          onChange={(e) => setEditingPreset({ ...editingPreset, defaultDir: e.target.value })}
                          className="w-full px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                          placeholder="~/Code"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-theme-muted mb-1">Startup Command</label>
                        <input
                          type="text"
                          value={editingPreset.initialCommand || ''}
                          onChange={(e) => setEditingPreset({ ...editingPreset, initialCommand: e.target.value })}
                          className="w-full px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                          placeholder="claude"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingPreset(null)}
                          className="px-3 py-1 text-xs bg-theme-primary text-theme-secondary rounded hover:text-theme-primary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSavePreset(editingPreset)}
                          className="px-3 py-1 text-xs btn-accent rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-theme-primary text-sm">{preset.name}</div>
                        <div className="text-xs text-theme-muted">{preset.user}@{preset.host}:{preset.port}</div>
                        {preset.defaultDir && (
                          <div className="text-xs text-theme-muted mt-1">
                            <span className="text-purple-400">cd</span> {preset.defaultDir}
                            {preset.initialCommand && (
                              <span> → <span className="text-green-400">{preset.initialCommand}</span></span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingPreset(preset)}
                        className="p-1 text-theme-muted hover:text-theme-primary"
                        title="Edit preset"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
