import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CosmicReading } from '@/types/astrology';

interface CosmicReadingContextValue {
  reading: CosmicReading | null;
  audioSource: 'elevenlabs' | 'procedural' | null;
  audioUrl: string | null;
  setReadingData: (reading: CosmicReading, audioUrl: string | null, audioSource: 'elevenlabs' | 'procedural' | null) => void;
  clearReading: () => void;
}

const CosmicReadingContext = createContext<CosmicReadingContextValue | null>(null);

export function CosmicReadingProvider({ children }: { children: ReactNode }) {
  const [reading, setReading] = useState<CosmicReading | null>(null);
  const [audioSource, setAudioSource] = useState<'elevenlabs' | 'procedural' | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const setReadingData = useCallback(
    (r: CosmicReading, url: string | null, source: 'elevenlabs' | 'procedural' | null) => {
      setReading(r);
      setAudioUrl(url);
      setAudioSource(source);
    },
    [],
  );

  const clearReading = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setReading(null);
    setAudioUrl(null);
    setAudioSource(null);
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
