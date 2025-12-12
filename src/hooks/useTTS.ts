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
    (text: string, currentSettings: TTSSettings) => {
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
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentTextRef.current = '';
      };

      utterance.onerror = () => {
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

  // Re-apply settings in real-time when they change during speech
  useEffect(() => {
    if (isSpeaking && currentTextRef.current && !isPaused) {
      // Restart speech with new settings
      speakWithSettings(currentTextRef.current, settings);
    }
  }, [settings, isSpeaking, isPaused, speakWithSettings]);

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
