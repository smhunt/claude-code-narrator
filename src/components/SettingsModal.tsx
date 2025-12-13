import { useState, useEffect } from 'react';
import type { TTSSettings, OpenAIVoice } from '../hooks/useTTS';
import { OPENAI_VOICES } from '../hooks/useTTS';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { Theme } from '../lib/themes';
import { loadSSHPresets, saveSSHPresets, type SSHPreset } from '../lib/sshPresets';
import { BACKEND_URL } from '../lib/socket';

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
  // Connection
  onConnectPreset?: (preset: SSHPreset) => void;
  isConnected?: boolean;
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
  onConnectPreset,
  isConnected,
}: SettingsModalProps) {
  const [presets, setPresets] = useState<SSHPreset[]>([]);
  const [editingPreset, setEditingPreset] = useState<SSHPreset | null>(null);
  const [directories, setDirectories] = useState<string[]>(['~/Code']);
  const [showDirDropdown, setShowDirDropdown] = useState(false);

  // Load presets and directories when modal opens
  useEffect(() => {
    if (isOpen) {
      setPresets(loadSSHPresets());
      // Fetch directories from server
      fetch(`${BACKEND_URL}/api/directories`)
        .then(res => res.json())
        .then(data => setDirectories(data.directories || ['~/Code']))
        .catch(() => setDirectories(['~/Code']));
    }
  }, [isOpen]);

  // Filter directories based on input
  const filteredDirs = directories.filter(dir =>
    dir.toLowerCase().includes((editingPreset?.defaultDir || '').toLowerCase())
  );

  const handleSavePreset = (preset: SSHPreset) => {
    // Check if this is a new preset or updating existing
    const exists = presets.some(p => p.id === preset.id);
    const updated = exists
      ? presets.map(p => p.id === preset.id ? preset : p)
      : [...presets, preset];
    setPresets(updated);
    saveSSHPresets(updated);
    setEditingPreset(null);
  };

  const handleAddNew = () => {
    const newPreset: SSHPreset = {
      id: `preset-${Date.now()}`,
      name: 'New Connection',
      host: '',
      user: '',
      port: 22,
      defaultDir: '~/Code',
      initialCommand: 'claude',
    };
    setEditingPreset(newPreset);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Connection Presets
              </h3>
              <button
                onClick={handleAddNew}
                className="px-2 py-1 text-xs btn-accent rounded flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New
              </button>
            </div>

            <div className="space-y-3">
              {/* Show new preset form if editing a new one */}
              {editingPreset && !presets.some(p => p.id === editingPreset.id) && (
                <div className="bg-theme-tertiary rounded-lg p-3 border-2 border-dashed border-[var(--accent-primary)]">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingPreset.name}
                        onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                        className="flex-1 px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                        placeholder="Connection Name"
                        autoFocus
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
                        placeholder="Host (IP or hostname)"
                      />
                      <input
                        type="number"
                        value={editingPreset.port}
                        onChange={(e) => setEditingPreset({ ...editingPreset, port: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs text-theme-muted mb-1">Default Directory</label>
                      <input
                        type="text"
                        value={editingPreset.defaultDir || ''}
                        onChange={(e) => setEditingPreset({ ...editingPreset, defaultDir: e.target.value })}
                        onFocus={() => setShowDirDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDirDropdown(false), 150)}
                        className="w-full px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                        placeholder="~/Code"
                      />
                      {showDirDropdown && filteredDirs.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-theme-secondary border border-theme rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredDirs.map((dir) => (
                            <button
                              key={dir}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setEditingPreset({ ...editingPreset, defaultDir: dir });
                                setShowDirDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-theme-primary hover:bg-theme-tertiary transition-colors"
                            >
                              {dir}
                            </button>
                          ))}
                        </div>
                      )}
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
                        disabled={!editingPreset.host || !editingPreset.name}
                        className="px-3 py-1 text-xs btn-accent rounded disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                      <div className="relative">
                        <label className="block text-xs text-theme-muted mb-1">Default Directory</label>
                        <input
                          type="text"
                          value={editingPreset.defaultDir || ''}
                          onChange={(e) => setEditingPreset({ ...editingPreset, defaultDir: e.target.value })}
                          onFocus={() => setShowDirDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDirDropdown(false), 150)}
                          className="w-full px-2 py-1 bg-theme-primary text-theme-primary rounded text-sm border border-theme"
                          placeholder="~/Code"
                        />
                        {showDirDropdown && filteredDirs.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-theme-secondary border border-theme rounded-lg shadow-lg max-h-40 overflow-y-auto">
                            {filteredDirs.map((dir) => (
                              <button
                                key={dir}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setEditingPreset({ ...editingPreset, defaultDir: dir });
                                  setShowDirDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-theme-primary hover:bg-theme-tertiary transition-colors"
                              >
                                {dir}
                              </button>
                            ))}
                          </div>
                        )}
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
                      <div className="flex gap-2 justify-between">
                        {presets.some(p => p.id === editingPreset.id) && (
                          <button
                            onClick={() => handleDeletePreset(editingPreset.id)}
                            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded"
                          >
                            Delete
                          </button>
                        )}
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => setEditingPreset(null)}
                            className="px-3 py-1 text-xs bg-theme-primary text-theme-secondary rounded hover:text-theme-primary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSavePreset(editingPreset)}
                            disabled={!editingPreset.host || !editingPreset.name}
                            className="px-3 py-1 text-xs btn-accent rounded disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View mode - clickable to connect
                    <button
                      onClick={() => {
                        if (onConnectPreset && !isConnected) {
                          onConnectPreset(preset);
                          onClose();
                        }
                      }}
                      disabled={isConnected}
                      className={`w-full text-left flex items-start justify-between group ${
                        !isConnected ? 'hover:bg-theme-primary/30 -m-3 p-3 rounded-lg transition-colors' : ''
                      } ${isConnected ? 'opacity-60' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-theme-primary text-sm flex items-center gap-2">
                          {preset.name}
                          {!isConnected && (
                            <span className="opacity-0 group-hover:opacity-100 text-xs text-[var(--accent-primary)] transition-opacity">
                              → Connect
                            </span>
                          )}
                        </div>
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
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPreset(preset);
                        }}
                        className="p-1 text-theme-muted hover:text-theme-primary"
                        title="Edit preset"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </button>
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
