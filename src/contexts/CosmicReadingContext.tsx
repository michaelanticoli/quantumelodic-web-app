import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CosmicReading } from '@/types/astrology';
import { CosmicReadingContext, loadFromSession, saveToSession } from './cosmicReadingStore';

export function CosmicReadingProvider({ children }: { children: ReactNode }) {
  const [reading, setReading] = useState<CosmicReading | null>(null);
  const [audioSource, setAudioSource] = useState<'elevenlabs' | 'procedural' | 'tone' | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Hydrate from sessionStorage on mount without auto-regenerating music.
  useEffect(() => {
    const saved = loadFromSession();
    if (!saved) return;
    setReading(saved.reading);
    setAudioSource(saved.audioSource);
    setAudioUrl(null);
    setAudioReady(true);
  }, []);

  const setReadingData = useCallback(
    (r: CosmicReading, url: string | null, source: 'elevenlabs' | 'procedural' | 'tone' | null) => {
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
    sessionStorage.removeItem('moontuner_reading');
  }, [audioUrl]);

  return (
    <CosmicReadingContext.Provider value={{ reading, audioSource, audioUrl, audioReady, setReadingData, updateReading, clearReading }}>
      {children}
    </CosmicReadingContext.Provider>
  );
}
