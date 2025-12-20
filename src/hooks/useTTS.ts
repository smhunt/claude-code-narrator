import { useState, useCallback, useEffect, useRef } from 'react';

export type TTSProvider = 'browser' | 'openai';
export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSSettings {
  provider: TTSProvider;
  // Browser TTS settings
  rate: number;
  pitch: number;
  volume: number;
  voiceIndex: number;
  // OpenAI TTS settings
  openaiVoice: OpenAIVoice;
  openaiSpeed: number;
}

export interface UseTTSReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  voices: SpeechSynthesisVoice[];
  settings: TTSSettings;
  updateSettings: (settings: Partial<TTSSettings>) => void;
  openaiAvailable: boolean;
}

const OPENAI_VOICES: { value: OpenAIVoice; label: string }[] = [
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British)' },
  { value: 'onyx', label: 'Onyx (Deep Male)' },
  { value: 'shimmer', label: 'Shimmer (Female)' },
];

export { OPENAI_VOICES };

const DEFAULT_SETTINGS: TTSSettings = {
  provider: 'browser',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voiceIndex: 0,
  openaiVoice: 'nova',
  openaiSpeed: 1.0,
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

// Detect Caddy subdomain access vs direct IP access
function getApiBase(): string {
  const hostname = window.location.hostname;

  // If accessed via Caddy subdomain (narrator.dev.ecoworks.ca)
  if (hostname === 'narrator.dev.ecoworks.ca') {
    return 'https://api.narrator.dev.ecoworks.ca';
  }

  // Direct IP/localhost access - use port-based URL
  return import.meta.env.VITE_API_URL || `http://${hostname}:3086`;
}

const API_BASE = getApiBase();

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>(loadSettings);
  const [openaiAvailable, setOpenaiAvailable] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTextRef = useRef<string>('');
  const isRestartingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Check if OpenAI TTS is available
  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then((res) => res.json())
      .then((data) => {
        setOpenaiAvailable(data.openaiTTSAvailable || false);
      })
      .catch(() => setOpenaiAvailable(false));
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Poll speechSynthesis state for browser TTS
  useEffect(() => {
    if (settings.provider !== 'browser') return;

    const syncState = () => {
      const speaking = speechSynthesis.speaking;
      const paused = speechSynthesis.paused;

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

    const interval = setInterval(syncState, 100);
    return () => clearInterval(interval);
  }, [settings.provider]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

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

  // Browser TTS speak
  const speakBrowser = useCallback(
    (text: string, currentSettings: TTSSettings, isRestart = false) => {
      console.log('[TTS Browser] speak called', {
        textLength: text?.length,
        isRestart,
        voiceIndex: currentSettings.voiceIndex,
        voicesAvailable: voices.length,
      });

      if (isRestart) {
        isRestartingRef.current = true;
      }

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = currentSettings.rate;
      utterance.pitch = currentSettings.pitch;
      utterance.volume = currentSettings.volume;

      if (voices[currentSettings.voiceIndex]) {
        utterance.voice = voices[currentSettings.voiceIndex];
        console.log('[TTS Browser] using voice:', voices[currentSettings.voiceIndex].name);
      } else {
        console.log('[TTS Browser] no voice at index', currentSettings.voiceIndex);
      }

      utterance.onstart = () => {
        console.log('[TTS Browser] onstart fired');
        isRestartingRef.current = false;
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        console.log('[TTS Browser] onend fired');
        if (!isRestartingRef.current) {
          setIsSpeaking(false);
          setIsPaused(false);
          currentTextRef.current = '';
        }
      };

      utterance.onerror = (e) => {
        console.error('[TTS Browser] onerror fired', e);
        isRestartingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      currentTextRef.current = text;
      console.log('[TTS Browser] calling speechSynthesis.speak()');
      speechSynthesis.speak(utterance);
    },
    [voices]
  );

  // OpenAI TTS speak
  const speakOpenAI = useCallback(
    async (text: string, currentSettings: TTSSettings) => {
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice: currentSettings.openaiVoice,
            speed: currentSettings.openaiSpeed,
          }),
        });

        if (!response.ok) {
          throw new Error('TTS request failed');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }

        const audio = new Audio(url);
        audio.volume = currentSettings.volume;
        audioRef.current = audio;
        currentTextRef.current = text;

        audio.onplay = () => {
          setIsLoading(false);
          setIsSpeaking(true);
          setIsPaused(false);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          currentTextRef.current = '';
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          setIsLoading(false);
          setIsSpeaking(false);
          setIsPaused(false);
          URL.revokeObjectURL(url);
        };

        await audio.play();
      } catch (error) {
        console.error('OpenAI TTS error:', error);
        setIsLoading(false);
        setIsSpeaking(false);
      }
    },
    []
  );

  const speak = useCallback(
    (text: string) => {
      console.log('[TTS] speak() called', {
        provider: settings.provider,
        textLength: text?.length,
        hasText: !!text,
      });
      if (!text) {
        console.warn('[TTS] speak() called with empty text');
        return;
      }
      if (settings.provider === 'openai') {
        speakOpenAI(text, settings);
      } else {
        speakBrowser(text, settings);
      }
    },
    [settings, speakBrowser, speakOpenAI]
  );

  // Track previous settings for browser TTS real-time updates
  const prevSettingsRef = useRef<TTSSettings | null>(null);

  useEffect(() => {
    if (settings.provider !== 'browser') return;

    const prev = prevSettingsRef.current;
    const settingsChanged = prev !== null && (
      prev.rate !== settings.rate ||
      prev.pitch !== settings.pitch ||
      prev.volume !== settings.volume ||
      prev.voiceIndex !== settings.voiceIndex
    );
    prevSettingsRef.current = settings;

    if (settingsChanged && isSpeakingRef.current && currentTextRef.current && !isPausedRef.current) {
      speakBrowser(currentTextRef.current, settings, true);
    }
  }, [settings, speakBrowser]);

  // Update OpenAI audio volume in real-time
  useEffect(() => {
    if (settings.provider === 'openai' && audioRef.current) {
      audioRef.current.volume = settings.volume;
    }
  }, [settings.volume, settings.provider]);

  const stop = useCallback(() => {
    if (settings.provider === 'openai') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      speechSynthesis.cancel();
    }
    currentTextRef.current = '';
    setIsSpeaking(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [settings.provider]);

  const pause = useCallback(() => {
    if (settings.provider === 'openai') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      speechSynthesis.pause();
    }
    setIsPaused(true);
  }, [settings.provider]);

  const resume = useCallback(() => {
    if (settings.provider === 'openai') {
      if (audioRef.current) {
        audioRef.current.play();
      }
    } else {
      speechSynthesis.resume();
    }
    setIsPaused(false);
  }, [settings.provider]);

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
    isLoading,
    voices,
    settings,
    updateSettings,
    openaiAvailable,
  };
}
