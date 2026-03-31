import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CosmicReading } from '@/types/astrology';
import { chartToScore } from '@/utils/chartToScore';
import { renderScoreToAudioUrl } from '@/utils/tonePlayer';

type AudioSource = 'elevenlabs' | 'procedural' | 'tone' | null;

const SESSION_KEY = 'moontuner_reading';

interface CosmicReadingContextValue {
  reading: CosmicReading | null;
  audioSource: AudioSource;
  audioUrl: string | null;
  audioReady: boolean;
  setReadingData: (reading: CosmicReading, audioUrl: string | null, audioSource: AudioSource) => void;
  clearReading: () => void;
}

const CosmicReadingContext = createContext<CosmicReadingContextValue | null>(null);

function saveToSession(reading: CosmicReading, audioSource: AudioSource) {
  try {
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
  const [audioReady, setAudioReady] = useState(false);

  // Hydrate from sessionStorage on mount, then re-render audio from chart data
  useEffect(() => {
    const saved = loadFromSession();
    if (saved) {
      setReading(saved.reading);
      setAudioSource(saved.audioSource);
      // Re-render audio from chart data (blob URLs don't survive navigation)
      if (saved.reading.chartData && saved.audioSource === 'tone') {
        const score = chartToScore(saved.reading.chartData);
        renderScoreToAudioUrl(score)
          .then((url) => {
            setAudioUrl(url);
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

  const clearReading = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setReading(null);
    setAudioUrl(null);
    setAudioSource(null);
    setAudioReady(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, [audioUrl]);

  return (
    <CosmicReadingContext.Provider value={{ reading, audioSource, audioUrl, audioReady, setReadingData, clearReading }}>
      {children}
    </CosmicReadingContext.Provider>
  );
}

export function useCosmicReadingContext() {
  const ctx = useContext(CosmicReadingContext);
  if (!ctx) throw new Error('useCosmicReadingContext must be inside CosmicReadingProvider');
  return ctx;
}
