import { useState, useCallback, useEffect } from 'react';
import type { TTSSettings } from './useTTS';

export interface VoiceProfile {
  id: string;
  name: string;
  settings: TTSSettings;
  createdAt: number;
  updatedAt: number;
}

export interface UseVoiceProfilesReturn {
  profiles: VoiceProfile[];
  activeProfileId: string | null;
  saveProfile: (name: string, settings: TTSSettings) => VoiceProfile;
  loadProfile: (id: string) => TTSSettings | null;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, newName: string) => void;
  updateProfile: (id: string, settings: TTSSettings) => void;
  setActiveProfile: (id: string | null) => void;
  getProfile: (id: string) => VoiceProfile | undefined;
}

const STORAGE_KEY = 'claude-narrator-voice-profiles';
const ACTIVE_PROFILE_KEY = 'claude-narrator-active-profile';

// Default profiles to seed new installations
const DEFAULT_PROFILES: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Natural (Default)',
    settings: {
      provider: 'browser',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voiceIndex: 0,
      openaiVoice: 'nova',
      openaiSpeed: 1.0,
    },
  },
  {
    name: 'Fast Reader',
    settings: {
      provider: 'browser',
      rate: 1.5,
      pitch: 1.0,
      volume: 1.0,
      voiceIndex: 0,
      openaiVoice: 'nova',
      openaiSpeed: 1.5,
    },
  },
  {
    name: 'Slow & Clear',
    settings: {
      provider: 'browser',
      rate: 0.8,
      pitch: 0.9,
      volume: 1.0,
      voiceIndex: 0,
      openaiVoice: 'nova',
      openaiSpeed: 0.75,
    },
  },
];

function generateId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadProfiles(): VoiceProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }

  // Seed with default profiles
  const now = Date.now();
  const defaultWithIds: VoiceProfile[] = DEFAULT_PROFILES.map((p, idx) => ({
    ...p,
    id: `default-${idx}`,
    createdAt: now,
    updatedAt: now,
  }));
  saveProfilesToStorage(defaultWithIds);
  return defaultWithIds;
}

function saveProfilesToStorage(profiles: VoiceProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore storage errors
  }
}

function loadActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

function saveActiveProfileId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function useVoiceProfiles(): UseVoiceProfilesReturn {
  const [profiles, setProfiles] = useState<VoiceProfile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => loadActiveProfileId());

  // Save profiles to localStorage when they change
  useEffect(() => {
    saveProfilesToStorage(profiles);
  }, [profiles]);

  // Save active profile ID to localStorage when it changes
  useEffect(() => {
    saveActiveProfileId(activeProfileId);
  }, [activeProfileId]);

  const saveProfile = useCallback((name: string, settings: TTSSettings): VoiceProfile => {
    const now = Date.now();
    const newProfile: VoiceProfile = {
      id: generateId(),
      name: name.trim() || 'Untitled Profile',
      settings: { ...settings },
      createdAt: now,
      updatedAt: now,
    };
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  const loadProfile = useCallback((id: string): TTSSettings | null => {
    const profile = profiles.find(p => p.id === id);
    return profile ? { ...profile.settings } : null;
  }, [profiles]);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    // Clear active profile if it was deleted
    if (activeProfileId === id) {
      setActiveProfileIdState(null);
    }
  }, [activeProfileId]);

  const renameProfile = useCallback((id: string, newName: string) => {
    setProfiles(prev => prev.map(p =>
      p.id === id
        ? { ...p, name: newName.trim() || p.name, updatedAt: Date.now() }
        : p
    ));
  }, []);

  const updateProfile = useCallback((id: string, settings: TTSSettings) => {
    setProfiles(prev => prev.map(p =>
      p.id === id
        ? { ...p, settings: { ...settings }, updatedAt: Date.now() }
        : p
    ));
  }, []);

  const setActiveProfile = useCallback((id: string | null) => {
    setActiveProfileIdState(id);
  }, []);

  const getProfile = useCallback((id: string): VoiceProfile | undefined => {
    return profiles.find(p => p.id === id);
  }, [profiles]);

  return {
    profiles,
    activeProfileId,
    saveProfile,
    loadProfile,
    deleteProfile,
    renameProfile,
    updateProfile,
    setActiveProfile,
    getProfile,
  };
}
