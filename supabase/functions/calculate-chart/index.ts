import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthData {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  latitude: number;
  longitude: number;
  timezone: number;
}

interface PlanetPosition {
  name: string;
  symbol: string;
  degree: number;
  sign: string;
  signNumber: number;
  isRetrograde: boolean;
}

const planetSymbols: Record<string, string> = {
  'Sun': '☉',
  'Moon': '☽',
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluto': '♇',
  'Ascendant': 'Asc',
};

const signNames = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, time, latitude, longitude, timezone } = await req.json() as BirthData;

    console.log("Calculating chart for:", { date, time, latitude, longitude, timezone });

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    // Use our accurate astronomical calculations directly
    // This is more reliable than external APIs that may be down or rate-limited
    const planets = calculatePlanetaryPositions(year, month, day, hour, minute, latitude, longitude, timezone);
    
    console.log("Calculated planets:", planets.map(p => `${p.name}: ${p.degree.toFixed(1)}° ${p.sign}`).join(', '));

    return new Response(JSON.stringify({
      planets,
      sunSign: planets.find(p => p.name === 'Sun')?.sign || 'Unknown',
      moonSign: planets.find(p => p.name === 'Moon')?.sign || 'Unknown',
      ascendant: planets.find(p => p.name === 'Ascendant')?.sign || 'Unknown',
      source: 'calculated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error calculating chart:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Accurate astronomical calculations for planetary positions
function calculatePlanetaryPositions(
  year: number, month: number, day: number, 
  hour: number, minute: number,
  latitude: number, longitude: number, timezone: number
): PlanetPosition[] {
  // Calculate Julian Day Number (more precise formula)
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Convert local time to UT
  const utHour = hour - timezone;
  const jd = jdn + (utHour + minute / 60) / 24 - 0.5;
  
  // Days and centuries since J2000.0 (January 1, 2000, 12:00 TT)
  const d = jd - 2451545.0;
  const T = d / 36525; // Julian centuries

  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;

  // Normalize angle to 0-360
  const normalize = (angle: number): number => {
    let result = angle % 360;
    if (result < 0) result += 360;
    return result;
  };

  // ========== SUN ==========
  // Mean longitude and anomaly
  const L0_sun = normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M_sun = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const M_rad = M_sun * DEG_TO_RAD;
  
  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M_rad)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M_rad)
          + 0.000289 * Math.sin(3 * M_rad);
  
  const sunLong = normalize(L0_sun + C);

  // ========== MOON ==========
  // Mean longitude
  const L_moon = normalize(218.3165 + 481267.8813 * T);
  // Mean elongation
  const D = normalize(297.8502 + 445267.1115 * T);
  // Mean anomaly
  const M_moon = normalize(134.9634 + 477198.8675 * T);
  // Argument of latitude
  const F = normalize(93.2721 + 483202.0175 * T);
  
  // Corrections (simplified but accurate enough for zodiac sign)
  const moonLong = normalize(
    L_moon 
    + 6.289 * Math.sin(M_moon * DEG_TO_RAD)
    - 1.274 * Math.sin((2 * D - M_moon) * DEG_TO_RAD)
    + 0.658 * Math.sin(2 * D * DEG_TO_RAD)
    - 0.214 * Math.sin(2 * M_moon * DEG_TO_RAD)
    - 0.186 * Math.sin(M_rad) // Sun's mean anomaly
  );

  // ========== PLANETS (using VSOP87 simplified) ==========
  
  // Mercury
  const L_mercury = normalize(252.2509 + 149472.6746 * T);
  const M_mercury = normalize(174.7948 + 149472.5153 * T);
  const mercuryLong = normalize(L_mercury + 23.4405 * Math.sin(M_mercury * DEG_TO_RAD) 
                               + 2.9818 * Math.sin(2 * M_mercury * DEG_TO_RAD));
  
  // Venus
  const L_venus = normalize(181.9798 + 58517.8039 * T);
  const M_venus = normalize(50.4161 + 58517.8039 * T);
  const venusLong = normalize(L_venus + 0.7758 * Math.sin(M_venus * DEG_TO_RAD));
  
  // Mars
  const L_mars = normalize(355.4330 + 19140.2993 * T);
  const M_mars = normalize(19.3730 + 19139.8585 * T);
  const marsLong = normalize(L_mars + 10.6912 * Math.sin(M_mars * DEG_TO_RAD)
                            + 0.6228 * Math.sin(2 * M_mars * DEG_TO_RAD));
  
  // Jupiter
  const L_jupiter = normalize(34.3515 + 3034.9057 * T);
  const M_jupiter = normalize(20.0202 + 3034.6962 * T);
  const jupiterLong = normalize(L_jupiter + 5.5549 * Math.sin(M_jupiter * DEG_TO_RAD)
                               + 0.1683 * Math.sin(2 * M_jupiter * DEG_TO_RAD));
  
  // Saturn
  const L_saturn = normalize(50.0774 + 1222.1139 * T);
  const M_saturn = normalize(317.0207 + 1222.1138 * T);
  const saturnLong = normalize(L_saturn + 6.3585 * Math.sin(M_saturn * DEG_TO_RAD)
                              + 0.5204 * Math.sin(2 * M_saturn * DEG_TO_RAD));
  
  // Uranus
  const uranusLong = normalize(314.055 + 428.4669 * T);
  
  // Neptune
  const neptuneLong = normalize(304.349 + 218.4862 * T);
  
  // Pluto (very simplified)
  const plutoLong = normalize(238.929 + 145.2078 * T);

  // ========== ASCENDANT ==========
  // Sidereal time at Greenwich
  const GMST = normalize(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  // Local sidereal time
  const LST = normalize(GMST + longitude);
  
  // Obliquity of the ecliptic
  const eps = 23.439291 - 0.0130042 * T;
  const eps_rad = eps * DEG_TO_RAD;
  const lat_rad = latitude * DEG_TO_RAD;
  const LST_rad = LST * DEG_TO_RAD;
  
  // Calculate ascendant
  const ascRad = Math.atan2(
    Math.cos(LST_rad),
    -(Math.sin(LST_rad) * Math.cos(eps_rad) + Math.tan(lat_rad) * Math.sin(eps_rad))
  );
  let ascendant = normalize(ascRad * RAD_TO_DEG);
  // Adjust for correct quadrant
  if (Math.cos(LST_rad) < 0) ascendant = normalize(ascendant + 180);

  // Determine retrograde motion for outer planets (simplified check)
  const isRetrograde = (planetLong: number, sunLong: number, isInner: boolean): boolean => {
    if (isInner) {
      // Inner planets: retrograde when between Earth and Sun
      const diff = Math.abs(normalize(planetLong - sunLong));
      return diff < 30 || diff > 330;
    } else {
      // Outer planets: retrograde when opposite to Sun
      const diff = Math.abs(normalize(planetLong - sunLong));
      return diff > 150 && diff < 210;
    }
  };

  const getSignFromDegree = (degree: number): { sign: string; signNumber: number } => {
    const normalizedDegree = normalize(degree);
    const signNumber = Math.floor(normalizedDegree / 30) + 1;
    return { sign: signNames[signNumber - 1], signNumber };
  };

  const createPlanet = (name: string, degree: number, isRetro = false): PlanetPosition => {
    const normalizedDegree = normalize(degree);
    const { sign, signNumber } = getSignFromDegree(normalizedDegree);
    return {
      name,
      symbol: planetSymbols[name] || '?',
      degree: normalizedDegree,
      sign,
      signNumber,
      isRetrograde: isRetro,
    };
  };

  return [
    createPlanet('Sun', sunLong),
    createPlanet('Moon', moonLong),
    createPlanet('Mercury', mercuryLong, isRetrograde(mercuryLong, sunLong, true)),
    createPlanet('Venus', venusLong, isRetrograde(venusLong, sunLong, true)),
    createPlanet('Mars', marsLong, isRetrograde(marsLong, sunLong, false)),
    createPlanet('Jupiter', jupiterLong, isRetrograde(jupiterLong, sunLong, false)),
    createPlanet('Saturn', saturnLong, isRetrograde(saturnLong, sunLong, false)),
    createPlanet('Uranus', uranusLong, isRetrograde(uranusLong, sunLong, false)),
    createPlanet('Neptune', neptuneLong, isRetrograde(neptuneLong, sunLong, false)),
    createPlanet('Pluto', plutoLong, isRetrograde(plutoLong, sunLong, false)),
    createPlanet('Ascendant', ascendant),
  ];
}
