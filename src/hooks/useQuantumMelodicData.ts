import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { QMPlanet, QMSign, QMAspect, QMHouse, ComputedAspect, QuantumMelodicReading } from '@/types/quantumMelodic';
import type { PlanetPosition } from '@/types/astrology';

export function useQuantumMelodicData() {
  // Use refs for the lookup data so callbacks stay stable
  const planetsRef = useRef<QMPlanet[]>([]);
  const signsRef   = useRef<QMSign[]>([]);
  const aspectsRef = useRef<QMAspect[]>([]);
  const housesRef  = useRef<QMHouse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  // Bump this when data is ready so consumers can react without unstable deps
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planetsRes, signsRes, aspectsRes, housesRes] = await Promise.all([
          supabase.from('qm_planets').select('*'),
          supabase.from('qm_signs').select('*'),
          supabase.from('qm_aspects').select('*'),
          supabase.from('qm_houses').select('*').order('number'),
        ]);

        if (planetsRes.error) throw planetsRes.error;
        if (signsRes.error)   throw signsRes.error;
        if (aspectsRes.error) throw aspectsRes.error;
        if (housesRes.error)  throw housesRes.error;

        planetsRef.current = planetsRes.data as QMPlanet[];
        signsRef.current   = signsRes.data   as QMSign[];
        aspectsRef.current = aspectsRes.data  as QMAspect[];
        housesRef.current  = housesRes.data   as QMHouse[];

        setDataReady(true);
      } catch (err) {
        console.error('Error fetching QM data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load QuantumMelodic data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Stable – never changes reference because it reads from refs
  const getHouseNumber = useCallback((degree: number, ascendantDegree: number): number => {
    const adjustedDegree = ((ascendantDegree - degree) % 360 + 360) % 360;
    return Math.floor(adjustedDegree / 30) + 1;
  }, []);

  const calculateAspects = useCallback((chartPlanets: PlanetPosition[]): ComputedAspect[] => {
    const aspects = aspectsRef.current;
    const computed: ComputedAspect[] = [];
    const relevantPlanets = chartPlanets.filter(p => p.name !== 'Ascendant');

    for (let i = 0; i < relevantPlanets.length; i++) {
      for (let j = i + 1; j < relevantPlanets.length; j++) {
        const p1 = relevantPlanets[i];
        const p2 = relevantPlanets[j];
        let angle = Math.abs(p1.degree - p2.degree);
        if (angle > 180) angle = 360 - angle;

        for (const aspect of aspects) {
          const orb = Math.abs(angle - aspect.angle);
          if (orb <= aspect.orb) {
            computed.push({ planet1: p1.name, planet2: p2.name, aspectType: aspect, exactAngle: angle, orb });
            break;
          }
        }
      }
    }
    return computed;
  }, []); // stable – reads from ref

  // Stable – reads from refs
  const buildReading = useCallback((chartPlanets: PlanetPosition[]): QuantumMelodicReading | null => {
    const planets = planetsRef.current;
    const signs   = signsRef.current;
    const houses  = housesRef.current;

    if (!planets.length || !signs.length || !aspectsRef.current.length || !houses.length) return null;

    const ascendant = chartPlanets.find(p => p.name === 'Ascendant');
    const ascDegree = ascendant?.degree || 0;

    const enrichedPlanets = chartPlanets.map(pos => {
      const qmData     = planets.find(p => p.name === pos.name) || null;
      const signData   = signs.find(s => s.name === pos.sign) || null;
      const houseNumber = getHouseNumber(pos.degree, ascDegree);
      const houseData  = houses.find(h => h.number === houseNumber) || null;
      return { position: pos, qmData, signData, houseNumber, houseData };
    });

    const computedAspects = calculateAspects(chartPlanets);

    const elementCounts: Record<string, number> = {};
    enrichedPlanets.forEach(p => {
      if (p.signData?.element) elementCounts[p.signData.element] = (elementCounts[p.signData.element] || 0) + 1;
    });
    const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Fire';

    const modalityCounts: Record<string, number> = {};
    enrichedPlanets.forEach(p => {
      if (p.signData?.modality) modalityCounts[p.signData.modality] = (modalityCounts[p.signData.modality] || 0) + 1;
    });
    const dominantModality = Object.entries(modalityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cardinal';

    const sunPlanet  = enrichedPlanets.find(p => p.position.name === 'Sun');
    const overallKey = sunPlanet?.signData?.key_signature || 'C major';

    const significantPlanets = enrichedPlanets.filter(p =>
      ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.position.name)
    );
    const avgTempo = significantPlanets.reduce((sum, p) => sum + (p.signData?.tempo_bpm || 90), 0) /
      Math.max(significantPlanets.length, 1);

    return { planets: enrichedPlanets, aspects: computedAspects, dominantElement, dominantModality, overallKey, overallTempo: Math.round(avgTempo) };
  }, [calculateAspects, getHouseNumber]); // stable – only depends on other stable callbacks

  return { loading, error, dataReady, calculateAspects, getHouseNumber, buildReading };
}
