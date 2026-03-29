import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CosmicReading } from '@/types/astrology';

type AudioSource = 'elevenlabs' | 'procedural' | 'tone' | null;

const SESSION_KEY = 'moontuner_reading';

interface CosmicReadingContextValue {
  reading: CosmicReading | null;
  audioSource: AudioSource;
  audioUrl: string | null;
  setReadingData: (reading: CosmicReading, audioUrl: string | null, audioSource: AudioSource) => void;
  clearReading: () => void;
}

const CosmicReadingContext = createContext<CosmicReadingContextValue | null>(null);

function saveToSession(reading: CosmicReading, audioSource: AudioSource) {
  try {
    // We can't persist blob URLs, so we save everything except audioUrl
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ reading, audioSource }));
  } catch {}
}

function loadFromSession(): { reading: CosmicReading; audioSource: AudioSource } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function CosmicReadingProvider({ children }: { children: ReactNode }) {
  const [reading, setReading] = useState<CosmicReading | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const saved = loadFromSession();
    if (saved) {
      setReading(saved.reading);
      setAudioSource(saved.audioSource);
      // audioUrl (blob) can't be restored — user can re-generate audio
      setAudioUrl(saved.reading.audioUrl ?? null);
    }
    setHydrated(true);
  }, []);

  const setReadingData = useCallback(
    (r: CosmicReading, url: string | null, source: AudioSource) => {
      setReading(r);
      setAudioUrl(url);
      setAudioSource(source);
      saveToSession(r, source);
    },
    [],
  );

  const clearReading = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setReading(null);
    setAudioUrl(null);
    setAudioSource(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, [audioUrl]);

  return (
    <CosmicReadingContext.Provider value={{ reading, audioSource, audioUrl, setReadingData, clearReading }}>
      {children}
    </CosmicReadingContext.Provider>
  );
}

export function useCosmicReadingContext() {
  const ctx = useContext(CosmicReadingContext);
  if (!ctx) throw new Error('useCosmicReadingContext must be inside CosmicReadingProvider');
  return ctx;
}
