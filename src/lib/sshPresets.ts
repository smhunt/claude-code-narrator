export interface SSHPreset {
  id: string;
  name: string;
  host: string;
  user: string;
  port: number;
  defaultDir?: string; // Directory to cd to after connecting
  initialCommand?: string; // Command to run after cd (e.g., 'claude')
}

const STORAGE_KEY = 'claude-narrator-ssh-presets';

// Default presets
const DEFAULT_PRESETS: SSHPreset[] = [
  {
    id: 'ha-eco',
    name: 'HA Server',
    host: '10.10.10.24',
    user: 'seanhunt',
    port: 22,
    defaultDir: '~/Code',
    initialCommand: 'claude',
  },
  {
    id: 'imac',
    name: "Sean's iMac",
    host: '10.10.10.154',
    user: 'seanhunt',
    port: 22,
    defaultDir: '~/Code',
    initialCommand: 'claude',
  },
];

export function loadSSHPresets(): SSHPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const presets = JSON.parse(stored) as SSHPreset[];
      // Merge with defaults (defaults take precedence for matching IDs)
      const defaultIds = new Set(DEFAULT_PRESETS.map(p => p.id));
      const customPresets = presets.filter(p => !defaultIds.has(p.id));
      return [...DEFAULT_PRESETS, ...customPresets];
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_PRESETS;
}

export function saveSSHPresets(presets: SSHPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function addSSHPreset(preset: Omit<SSHPreset, 'id'>): SSHPreset[] {
  const presets = loadSSHPresets();
  const newPreset: SSHPreset = {
    ...preset,
    id: `custom-${Date.now()}`,
  };
  const updated = [...presets, newPreset];
  saveSSHPresets(updated);
  return updated;
}

export function removeSSHPreset(id: string): SSHPreset[] {
  const presets = loadSSHPresets();
  // Don't allow removing default presets
  const defaultIds = new Set(DEFAULT_PRESETS.map(p => p.id));
  if (defaultIds.has(id)) {
    return presets;
  }
  const updated = presets.filter(p => p.id !== id);
  saveSSHPresets(updated);
  return updated;
}

export function updateSSHPreset(id: string, updates: Partial<Omit<SSHPreset, 'id'>>): SSHPreset[] {
  const presets = loadSSHPresets();
  const updated = presets.map(p =>
    p.id === id ? { ...p, ...updates } : p
  );
  saveSSHPresets(updated);
  return updated;
}
