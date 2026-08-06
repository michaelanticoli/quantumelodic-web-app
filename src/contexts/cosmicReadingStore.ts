import { createContext, useContext } from 'react';
import type { CosmicReading } from '@/types/astrology';

export type AudioSource = 'elevenlabs' | 'procedural' | 'tone' | null;
export const SESSION_KEY = 'moontuner_reading';

export interface CosmicReadingContextValue {
  reading: CosmicReading | null;
  audioSource: AudioSource;
  audioUrl: string | null;
  audioReady: boolean;
  setReadingData: (reading: CosmicReading, audioUrl: string | null, audioSource: AudioSource) => void;
  updateReading: (patch: Partial<CosmicReading>) => void;
  clearReading: () => void;
}

export const CosmicReadingContext = createContext<CosmicReadingContextValue | null>(null);

export function getPersistableReading(reading: CosmicReading): CosmicReading {
  return {
    ...reading,
    // intentionally remove audioUrl when persisting
    // (the runtime provider will rehydrate audio state separately)
    audioUrl: undefined as unknown as string,
  };
}

export function saveToSession(reading: CosmicReading, audioSource: AudioSource) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ reading: getPersistableReading(reading), audioSource }));
  } catch (error) {
    console.warn('Unable to persist reading preview to session storage (quota exceeded or private browsing may block storage):', error);
  }
}

export function loadFromSession(): { reading: CosmicReading; audioSource: AudioSource } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useCosmicReadingContext() {
  const ctx = useContext(CosmicReadingContext);
  if (!ctx) throw new Error('useCosmicReadingContext must be inside CosmicReadingProvider');
  return ctx;
}
