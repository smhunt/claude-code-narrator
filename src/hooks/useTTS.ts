import { useState, useCallback, useEffect, useRef } from 'react';

export interface TTSSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceIndex: number;
}

export interface UseTTSReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  settings: TTSSettings;
  updateSettings: (settings: Partial<TTSSettings>) => void;
}

const DEFAULT_SETTINGS: TTSSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voiceIndex: 0,
};

const STORAGE_KEY = 'claude-narrator-tts-settings';

function loadSettings(): TTSSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: TTSSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>(loadSettings);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentTextRef = useRef<string>('');
  const isRestartingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Poll speechSynthesis state to keep React state in sync
  // This handles edge cases where callbacks don't fire reliably
  useEffect(() => {
    const syncState = () => {
      const speaking = speechSynthesis.speaking;
      const paused = speechSynthesis.paused;

      // Only update if we're not in the middle of a restart
      if (!isRestartingRef.current) {
        if (speaking && !isSpeakingRef.current) {
          setIsSpeaking(true);
        } else if (!speaking && isSpeakingRef.current && !paused) {
          setIsSpeaking(false);
          setIsPaused(false);
          currentTextRef.current = '';
        }

        if (paused !== isPausedRef.current && speaking) {
          setIsPaused(paused);
        }
      }
    };

    // Poll every 100ms
    const interval = setInterval(syncState, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Prefer an English voice by default
      const englishIndex = availableVoices.findIndex(
        (v) => v.lang.startsWith('en') && v.localService
      );
      if (englishIndex >= 0) {
        setSettings((prev) => ({ ...prev, voiceIndex: englishIndex }));
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speakWithSettings = useCallback(
    (text: string, currentSettings: TTSSettings, isRestart = false) => {
      // Mark that we're restarting to prevent polling interference
      if (isRestart) {
        isRestartingRef.current = true;
      }

      // Stop any current speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = currentSettings.rate;
      utterance.pitch = currentSettings.pitch;
      utterance.volume = currentSettings.volume;

      if (voices[currentSettings.voiceIndex]) {
        utterance.voice = voices[currentSettings.voiceIndex];
      }

      utterance.onstart = () => {
        isRestartingRef.current = false;
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        // Don't reset state if we're in the middle of a restart
        if (!isRestartingRef.current) {
          setIsSpeaking(false);
          setIsPaused(false);
          currentTextRef.current = '';
        }
      };

      utterance.onerror = () => {
        isRestartingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      currentTextRef.current = text;
      speechSynthesis.speak(utterance);
    },
    [voices]
  );

  const speak = useCallback(
    (text: string) => {
      speakWithSettings(text, settings);
    },
    [settings, speakWithSettings]
  );

  // Track previous settings to detect actual changes
  const prevSettingsRef = useRef<TTSSettings | null>(null);

  // Re-apply settings in real-time when they change during speech
  useEffect(() => {
    // Check if settings actually changed (not just a re-render)
    const prev = prevSettingsRef.current;
    const settingsChanged = prev !== null && (
      prev.rate !== settings.rate ||
      prev.pitch !== settings.pitch ||
      prev.volume !== settings.volume ||
      prev.voiceIndex !== settings.voiceIndex
    );
    prevSettingsRef.current = settings;

    // Only restart if settings changed AND we're currently speaking
    if (settingsChanged && isSpeakingRef.current && currentTextRef.current && !isPausedRef.current) {
      speakWithSettings(currentTextRef.current, settings, true);
    }
  }, [settings, speakWithSettings]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    currentTextRef.current = '';
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    voices,
    settings,
    updateSettings,
  };
}
