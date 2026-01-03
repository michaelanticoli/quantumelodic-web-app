import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthData {
  date: string;
  time: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: number;
}

interface PlanetPosition {
  name: string;
  symbol: string;
  degree: number;
  sign: string;
  signNumber: number;
  isRetrograde: boolean;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  timezone: number;
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

// Geocode location using Nominatim (server-side to avoid CORS)
async function geocodeLocation(location: string): Promise<GeocodingResult> {
  console.log(`Geocoding location: ${location}`);
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
    {
      headers: {
        'User-Agent': 'QuantumMelodies/1.0 (cosmic music generation app)'
      }
    }
  );

  if (!response.ok) {
    console.error(`Geocoding failed with status: ${response.status}`);
    throw new Error('Failed to geocode location');
  }

  const results = await response.json();
  console.log(`Geocoding results count:`, results.length);
  
  if (results.length === 0) {
    console.warn('Location not found, using default coordinates (NYC)');
    return { latitude: 40.7128, longitude: -74.0060, timezone: -5 };
  }

  const { lat, lon } = results[0];
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const timezone = Math.round(longitude / 15);
  
  console.log(`Geocoded to: lat=${latitude}, lon=${longitude}, tz=${timezone}`);
  
  return { latitude, longitude, timezone };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const birthData: BirthData = await req.json();
    console.log('Calculating chart for:', birthData);

    let { date, time, latitude, longitude, timezone } = birthData;
    
    // Geocode if location provided but no coordinates
    if (birthData.location && (latitude === undefined || longitude === undefined)) {
      const geo = await geocodeLocation(birthData.location);
      latitude = geo.latitude;
      longitude = geo.longitude;
      timezone = geo.timezone;
    }
    
    if (latitude === undefined || longitude === undefined) {
      throw new Error('Location or coordinates required');
    }
    
    if (timezone === undefined) {
      timezone = Math.round(longitude / 15);
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    // Use our accurate astronomical calculations directly
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

  // ========== PLANETS (accurate Keplerian elements with perturbations) ==========
  
  // Helper: solve Kepler's equation for eccentric anomaly
  const solveKepler = (M: number, e: number): number => {
    const M_rad = M * DEG_TO_RAD;
    let E = M_rad;
    for (let i = 0; i < 10; i++) {
      E = M_rad + e * Math.sin(E);
    }
    return E;
  };

  // Helper: calculate heliocentric longitude from orbital elements
  const helioLongitude = (L: number, w: number, W: number, M: number, e: number, i: number): number => {
    const E = solveKepler(M, e);
    // True anomaly
    const v = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    ) * RAD_TO_DEG;
    // Heliocentric longitude in orbital plane
    const lon = normalize(v + w);
    // Convert to ecliptic (simplified for small inclinations)
    return normalize(lon + W);
  };

  // ========== MERCURY ==========
  // Orbital elements at J2000.0 with rates
  const mercury_L = normalize(252.250906 + 149472.6746358 * T);
  const mercury_a = 0.38709927;
  const mercury_e = 0.20563593 + 0.00001906 * T;
  const mercury_i = 7.00497902 - 0.00594749 * T;
  const mercury_W = 48.33076593 - 0.12534081 * T; // longitude of ascending node
  const mercury_w_bar = 77.45779628 + 0.16047689 * T; // longitude of perihelion
  const mercury_w = mercury_w_bar - mercury_W; // argument of perihelion
  const mercury_M = normalize(mercury_L - mercury_w_bar);
  
  let mercuryLong = helioLongitude(mercury_L, mercury_w, mercury_W, mercury_M, mercury_e, mercury_i);
  // Apply perturbations from other planets
  const mercuryPert = 
    + 4.40 * Math.sin((2 * mercury_M + 130.3) * DEG_TO_RAD)
    - 2.50 * Math.sin(M_sun * DEG_TO_RAD)
    + 1.10 * Math.sin((mercury_M - M_sun + 20) * DEG_TO_RAD);
  mercuryLong = normalize(mercuryLong + mercuryPert);

  // ========== VENUS ==========
  const venus_L = normalize(181.979801 + 58517.8156760 * T);
  const venus_e = 0.00677672 - 0.00004107 * T;
  const venus_i = 3.39467605 - 0.00078890 * T;
  const venus_W = 76.67984255 - 0.27769418 * T;
  const venus_w_bar = 131.60246718 + 0.00268329 * T;
  const venus_w = venus_w_bar - venus_W;
  const venus_M = normalize(venus_L - venus_w_bar);
  
  let venusLong = helioLongitude(venus_L, venus_w, venus_W, venus_M, venus_e, venus_i);
  // Perturbations
  const venusPert = 
    + 2.76 * Math.cos((3 * venus_M - 2 * M_sun + 12) * DEG_TO_RAD)
    + 0.54 * Math.sin((venus_M - M_sun) * DEG_TO_RAD)
    - 0.50 * Math.sin((2 * mercury_M - 3 * venus_M) * DEG_TO_RAD);
  venusLong = normalize(venusLong + venusPert);

  // ========== MARS ==========
  const mars_L = normalize(355.433275 + 19140.2993313 * T);
  const mars_e = 0.09339410 + 0.00007882 * T;
  const mars_i = 1.84969142 - 0.00813131 * T;
  const mars_W = 49.55953891 - 0.29257343 * T;
  const mars_w_bar = 336.05637041 + 0.44441088 * T;
  const mars_w = mars_w_bar - mars_W;
  const mars_M = normalize(mars_L - mars_w_bar);
  
  let marsLong = helioLongitude(mars_L, mars_w, mars_W, mars_M, mars_e, mars_i);
  // Major perturbations from Jupiter
  const M_jupiter_pert = normalize(20.020 + 3034.6962 * T);
  const marsPert = 
    - 0.85 * Math.cos((mars_M - 2 * M_jupiter_pert + 68) * DEG_TO_RAD)
    + 0.51 * Math.cos((2 * mars_M - M_jupiter_pert) * DEG_TO_RAD)
    - 0.32 * Math.cos((mars_M + M_sun) * DEG_TO_RAD);
  marsLong = normalize(marsLong + marsPert);

  // ========== JUPITER ==========
  const jupiter_L = normalize(34.351484 + 3034.9056746 * T);
  const jupiter_e = 0.04838624 - 0.00013253 * T;
  const jupiter_i = 1.30326903 - 0.00183714 * T;
  const jupiter_W = 100.47390909 + 0.20469106 * T;
  const jupiter_w_bar = 14.72847983 + 0.21252668 * T;
  const jupiter_w = jupiter_w_bar - jupiter_W;
  const jupiter_M = normalize(jupiter_L - jupiter_w_bar);
  
  let jupiterLong = helioLongitude(jupiter_L, jupiter_w, jupiter_W, jupiter_M, jupiter_e, jupiter_i);
  // Saturn perturbation
  const M_saturn_pert = normalize(317.020 + 1222.1138 * T);
  const jupiterPert = 
    - 0.332 * Math.sin((2 * jupiter_M - 5 * M_saturn_pert - 67) * DEG_TO_RAD)
    + 0.056 * Math.sin((2 * jupiter_M - 2 * M_saturn_pert + 21) * DEG_TO_RAD);
  jupiterLong = normalize(jupiterLong + jupiterPert);

  // ========== SATURN ==========
  const saturn_L = normalize(50.077471 + 1222.1137943 * T);
  const saturn_e = 0.05386179 - 0.00050991 * T;
  const saturn_i = 2.48599187 + 0.00193609 * T;
  const saturn_W = 113.66242448 - 0.28867794 * T;
  const saturn_w_bar = 92.59887831 - 0.41897216 * T;
  const saturn_w = saturn_w_bar - saturn_W;
  const saturn_M = normalize(saturn_L - saturn_w_bar);
  
  let saturnLong = helioLongitude(saturn_L, saturn_w, saturn_W, saturn_M, saturn_e, saturn_i);
  // Jupiter perturbation
  const saturnPert = 
    + 0.812 * Math.sin((2 * jupiter_M - 5 * saturn_M + 67) * DEG_TO_RAD)
    - 0.229 * Math.cos((2 * jupiter_M - 4 * saturn_M + 2) * DEG_TO_RAD);
  saturnLong = normalize(saturnLong + saturnPert);

  // ========== URANUS ==========
  const uranus_L = normalize(314.055005 + 428.4669983 * T);
  const uranus_e = 0.04725744 - 0.00004397 * T;
  const uranus_i = 0.77263783 - 0.00242939 * T;
  const uranus_W = 74.01692503 + 0.04240589 * T;
  const uranus_w_bar = 170.95427630 + 0.40805281 * T;
  const uranus_w = uranus_w_bar - uranus_W;
  const uranus_M = normalize(uranus_L - uranus_w_bar);
  
  const uranusLong = helioLongitude(uranus_L, uranus_w, uranus_W, uranus_M, uranus_e, uranus_i);

  // ========== NEPTUNE ==========
  const neptune_L = normalize(304.348665 + 218.4862002 * T);
  const neptune_e = 0.00859048 + 0.00000603 * T;
  const neptune_i = 1.77004347 + 0.00035372 * T;
  const neptune_W = 131.78422574 - 0.00508664 * T;
  const neptune_w_bar = 44.96476227 - 0.32241464 * T;
  const neptune_w = neptune_w_bar - neptune_W;
  const neptune_M = normalize(neptune_L - neptune_w_bar);
  
  const neptuneLong = helioLongitude(neptune_L, neptune_w, neptune_W, neptune_M, neptune_e, neptune_i);

  // ========== PLUTO (polynomial fit) ==========
  const plutoLong = normalize(
    238.9588 + 144.96 * T
    + 3.908 * Math.sin((178.7 + 144.96 * T) * DEG_TO_RAD)
  );

  // ========== Convert heliocentric to geocentric ==========
  // For accurate geocentric positions, we need Earth's position
  const earth_L = normalize(100.466449 + 35999.3728519 * T);
  const earth_e = 0.01671123 - 0.00004392 * T;
  const earth_w_bar = 102.93768193 + 0.32327364 * T;
  const earth_M = normalize(earth_L - earth_w_bar);
  const earth_E = solveKepler(earth_M, earth_e);
  
  // Earth's heliocentric radius and true anomaly
  const earth_v = 2 * Math.atan2(
    Math.sqrt(1 + earth_e) * Math.sin(earth_E / 2),
    Math.sqrt(1 - earth_e) * Math.cos(earth_E / 2)
  ) * RAD_TO_DEG;
  const earth_lon = normalize(earth_v + earth_w_bar);
  const earth_r = 1.00000011 * (1 - earth_e * earth_e) / (1 + earth_e * Math.cos(earth_v * DEG_TO_RAD));

  // Proper geocentric conversion using vector math
  const helioToGeo = (helioLong: number, a: number, e: number, M: number): number => {
    // Calculate planet's heliocentric radius
    const E = solveKepler(M, e);
    const v = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    ) * RAD_TO_DEG;
    const r = a * (1 - e * e) / (1 + e * Math.cos(v * DEG_TO_RAD));
    
    // Convert to heliocentric Cartesian coordinates
    const planet_x = r * Math.cos(helioLong * DEG_TO_RAD);
    const planet_y = r * Math.sin(helioLong * DEG_TO_RAD);
    
    // Earth's heliocentric Cartesian (Earth is at earth_lon, opposite from Sun as seen from Earth)
    const earth_x = earth_r * Math.cos(earth_lon * DEG_TO_RAD);
    const earth_y = earth_r * Math.sin(earth_lon * DEG_TO_RAD);
    
    // Geocentric = planet position - Earth position
    const geo_x = planet_x - earth_x;
    const geo_y = planet_y - earth_y;
    
    // Convert back to geocentric longitude
    return normalize(Math.atan2(geo_y, geo_x) * RAD_TO_DEG);
  };

  // Apply proper geocentric corrections to inner planets
  mercuryLong = helioToGeo(mercuryLong, mercury_a, mercury_e, mercury_M);
  venusLong = helioToGeo(venusLong, 0.72333566, venus_e, venus_M);

  // ========== ASCENDANT ==========
  // Sidereal time at Greenwich (in degrees)
  const GMST = normalize(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  // Local sidereal time (RAMC - Right Ascension of Midheaven)
  const LST = normalize(GMST + longitude);
  
  // Obliquity of the ecliptic
  const eps = 23.439291 - 0.0130042 * T;
  const eps_rad = eps * DEG_TO_RAD;
  const lat_rad = latitude * DEG_TO_RAD;
  const LST_rad = LST * DEG_TO_RAD;
  
  // Calculate ascendant using the standard formula
  // ASC = atan2(cos(RAMC), -(sin(RAMC) * cos(ε) + tan(φ) * sin(ε)))
  const ascY = Math.cos(LST_rad);
  const ascX = -(Math.sin(LST_rad) * Math.cos(eps_rad) + Math.tan(lat_rad) * Math.sin(eps_rad));
  
  let ascendant = Math.atan2(ascY, ascX) * RAD_TO_DEG;
  ascendant = normalize(ascendant);
  
  // The atan2 result needs adjustment: it gives the angle from the positive x-axis
  // For the ascendant, we need to ensure proper quadrant based on LST
  // When LST is 0-180°, ASC should be in range 180-360° (Libra through Pisces)
  // When LST is 180-360°, ASC should be in range 0-180° (Aries through Virgo)
  // This is because the ascendant is the point rising on the eastern horizon
  if (LST >= 0 && LST < 180) {
    if (ascendant < 180) ascendant = normalize(ascendant + 180);
  } else {
    if (ascendant >= 180) ascendant = normalize(ascendant - 180);
  }

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
