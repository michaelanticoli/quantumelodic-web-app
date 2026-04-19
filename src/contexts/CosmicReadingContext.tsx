import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CosmicReading } from '@/types/astrology';
import { generateProceduralAudio } from '@/utils/proceduralAudio';

type AudioSource = 'elevenlabs' | 'procedural' | 'tone' | null;

const SESSION_KEY = 'moontuner_reading';
const PREVIEW_RENDER_TIMEOUT_MS = 20_000;

interface CosmicReadingContextValue {
  reading: CosmicReading | null;
  audioSource: AudioSource;
  audioUrl: string | null;
  audioReady: boolean;
  setReadingData: (reading: CosmicReading, audioUrl: string | null, audioSource: AudioSource) => void;
  updateReading: (patch: Partial<CosmicReading>) => void;
  clearReading: () => void;
}

const CosmicReadingContext = createContext<CosmicReadingContextValue | null>(null);

function getPersistableReading(reading: CosmicReading): CosmicReading {
  return {
    ...reading,
    audioUrl: undefined,
  };
}

function saveToSession(reading: CosmicReading, audioSource: AudioSource) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ reading: getPersistableReading(reading), audioSource }));
  } catch (error) {
    console.warn('Unable to persist reading preview to session storage (quota exceeded or private browsing may block storage):', error);
  }
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
  const [audioReady, setAudioReady] = useState(false);

  // Hydrate from sessionStorage on mount, then re-render audio from chart data
  useEffect(() => {
    const saved = loadFromSession();
    if (saved) {
      setReading(saved.reading);
      setAudioSource(saved.audioSource);
      // Re-render preview audio from chart data (blob URLs don't survive navigation).
      if (saved.reading.chartData && (saved.audioSource === 'procedural' || saved.audioSource === 'tone')) {
        const renderPromise = generateProceduralAudio(saved.reading.chartData);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Preview hydration render timed out after ${PREVIEW_RENDER_TIMEOUT_MS / 1000} seconds`)), PREVIEW_RENDER_TIMEOUT_MS)
        );
        Promise.race([renderPromise, timeoutPromise])
          .then((url) => {
            setAudioUrl(url);
            setAudioSource('procedural');
            setAudioReady(true);
          })
          .catch(() => {
            setAudioUrl(null);
            setAudioReady(true);
          });
      } else {
        setAudioReady(true);
      }
    }
  }, []);

  const setReadingData = useCallback(
    (r: CosmicReading, url: string | null, source: AudioSource) => {
      setReading(r);
      setAudioUrl(url);
      setAudioSource(source);
      setAudioReady(true);
      saveToSession(r, source);
    },
    [],
  );

  const updateReading = useCallback((patch: Partial<CosmicReading>) => {
    setReading((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      saveToSession(next, audioSource);
      return next;
    });
  }, [audioSource]);

  const clearReading = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setReading(null);
    setAudioUrl(null);
    setAudioSource(null);
    setAudioReady(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, [audioUrl]);

  return (
    <CosmicReadingContext.Provider value={{ reading, audioSource, audioUrl, audioReady, setReadingData, updateReading, clearReading }}>
      {children}
    </CosmicReadingContext.Provider>
  );
}

export function useCosmicReadingContext() {
  const ctx = useContext(CosmicReadingContext);
  if (!ctx) throw new Error('useCosmicReadingContext must be inside CosmicReadingProvider');
  return ctx;
}
