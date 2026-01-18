import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import Moshier's ephemeris via esm.sh - professional-grade accuracy (DE404)
import ephemeris from "https://esm.sh/ephemeris@2.2.0";

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

// Input validation helpers
function validateBirthData(data: unknown): { valid: true; data: BirthData } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate date format (YYYY-MM-DD)
  if (typeof obj.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }
  
  // Validate time format (HH:MM)
  if (typeof obj.time !== 'string' || !/^\d{2}:\d{2}$/.test(obj.time)) {
    return { valid: false, error: 'Invalid time format. Use HH:MM' };
  }
  
  // Validate date is reasonable (1900-2100)
  const year = parseInt(obj.date.split('-')[0]);
  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'Date must be between 1900 and 2100' };
  }
  
  // Validate location if provided
  if (obj.location !== undefined) {
    if (typeof obj.location !== 'string' || obj.location.length < 2 || obj.location.length > 200) {
      return { valid: false, error: 'Location must be 2-200 characters' };
    }
    // Sanitize location - remove potentially dangerous characters
    const sanitizedLocation = obj.location.replace(/[<>\"'&;]/g, '').trim();
    if (sanitizedLocation !== obj.location.trim()) {
      return { valid: false, error: 'Location contains invalid characters' };
    }
  }
  
  // Validate latitude if provided
  if (obj.latitude !== undefined) {
    if (typeof obj.latitude !== 'number' || obj.latitude < -90 || obj.latitude > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }
  }
  
  // Validate longitude if provided
  if (obj.longitude !== undefined) {
    if (typeof obj.longitude !== 'number' || obj.longitude < -180 || obj.longitude > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }
  }
  
  // Validate timezone if provided
  if (obj.timezone !== undefined) {
    if (typeof obj.timezone !== 'number' || obj.timezone < -12 || obj.timezone > 14) {
      return { valid: false, error: 'Timezone must be between -12 and 14' };
    }
  }
  
  return {
    valid: true,
    data: {
      date: obj.date,
      time: obj.time,
      location: obj.location as string | undefined,
      latitude: obj.latitude as number | undefined,
      longitude: obj.longitude as number | undefined,
      timezone: obj.timezone as number | undefined,
    }
  };
}

// Geocode location using Nominatim (server-side to avoid CORS)
async function geocodeLocation(location: string): Promise<GeocodingResult> {
  console.log(`Geocoding location: ${location}`);
  
  // Additional sanitization for URL encoding
  const sanitizedLocation = location.replace(/[<>\"'&;]/g, '').trim().substring(0, 200);
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sanitizedLocation)}&limit=1`,
    {
      headers: {
        'User-Agent': 'QuantumMelodies/1.0 (cosmic music generation app)'
      }
    }
  );

  if (!response.ok) {
    console.error(`Geocoding failed with status: ${response.status}`);
    throw new Error('Unable to process location');
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
    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const validation = validateBirthData(rawData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const birthData = validation.data;
    console.log('Calculating chart for date:', birthData.date, 'time:', birthData.time);

    let { date, time, latitude, longitude, timezone } = birthData;
    
    // Geocode if location provided but no coordinates
    if (birthData.location && (latitude === undefined || longitude === undefined)) {
      const geo = await geocodeLocation(birthData.location);
      latitude = geo.latitude;
      longitude = geo.longitude;
      timezone = geo.timezone;
    }
    
    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: 'Location or coordinates required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (timezone === undefined) {
      timezone = Math.round(longitude / 15);
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    // Create UTC date for ephemeris calculation
    // The ephemeris library expects a JavaScript Date object
    const utcHour = hour - timezone;
    const dateObj = new Date(Date.UTC(year, month - 1, day, utcHour, minute, 0));
    
    console.log(`Calculating ephemeris for UTC: ${dateObj.toISOString()}`);
    console.log(`Observer location: lat=${latitude}, lon=${longitude}`);

    // Calculate using Moshier's DE404 ephemeris (professional accuracy)
    const result = ephemeris.getAllPlanets(dateObj, longitude, latitude, 0);
    
    console.log("Ephemeris calculation complete");
    console.log("Date info:", result.date);

    // Extract planetary positions from the ephemeris result
    const planets: PlanetPosition[] = [];
    
    // Helper function to create planet position
    const createPlanet = (name: string, degree: number, isRetro = false): PlanetPosition => {
      const normalizedDegree = ((degree % 360) + 360) % 360;
      const signNumber = Math.floor(normalizedDegree / 30) + 1;
      return {
        name,
        symbol: planetSymbols[name] || '?',
        degree: normalizedDegree,
        sign: signNames[signNumber - 1],
        signNumber,
        isRetrograde: isRetro,
      };
    };

    // Map ephemeris results to our format
    const observed = result.observed;
    
    if (observed.sun) {
      planets.push(createPlanet('Sun', observed.sun.apparentLongitudeDd));
      console.log(`Sun: ${observed.sun.apparentLongitudeDd.toFixed(2)}°`);
    }
    
    if (observed.moon) {
      planets.push(createPlanet('Moon', observed.moon.apparentLongitudeDd));
      console.log(`Moon: ${observed.moon.apparentLongitudeDd.toFixed(2)}°`);
    }
    
    if (observed.mercury) {
      const isRetro = observed.mercury.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Mercury', observed.mercury.apparentLongitudeDd, isRetro));
      console.log(`Mercury: ${observed.mercury.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.venus) {
      const isRetro = observed.venus.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Venus', observed.venus.apparentLongitudeDd, isRetro));
      console.log(`Venus: ${observed.venus.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.mars) {
      const isRetro = observed.mars.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Mars', observed.mars.apparentLongitudeDd, isRetro));
      console.log(`Mars: ${observed.mars.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.jupiter) {
      const isRetro = observed.jupiter.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Jupiter', observed.jupiter.apparentLongitudeDd, isRetro));
      console.log(`Jupiter: ${observed.jupiter.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.saturn) {
      const isRetro = observed.saturn.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Saturn', observed.saturn.apparentLongitudeDd, isRetro));
      console.log(`Saturn: ${observed.saturn.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.uranus) {
      const isRetro = observed.uranus.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Uranus', observed.uranus.apparentLongitudeDd, isRetro));
      console.log(`Uranus: ${observed.uranus.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.neptune) {
      const isRetro = observed.neptune.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Neptune', observed.neptune.apparentLongitudeDd, isRetro));
      console.log(`Neptune: ${observed.neptune.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }
    
    if (observed.pluto) {
      const isRetro = observed.pluto.raw?.motion?.isRetrograde || false;
      planets.push(createPlanet('Pluto', observed.pluto.apparentLongitudeDd, isRetro));
      console.log(`Pluto: ${observed.pluto.apparentLongitudeDd.toFixed(2)}° ${isRetro ? '(R)' : ''}`);
    }

    // Calculate Ascendant using accurate astronomical formula
    const ascendant = calculateAscendant(year, month, day, utcHour, minute, latitude, longitude);
    planets.push(createPlanet('Ascendant', ascendant));
    console.log(`Ascendant: ${ascendant.toFixed(2)}°`);

    console.log("Final planets:", planets.map(p => `${p.name}: ${p.degree.toFixed(1)}° ${p.sign}`).join(', '));

    return new Response(JSON.stringify({
      planets,
      sunSign: planets.find(p => p.name === 'Sun')?.sign || 'Unknown',
      moonSign: planets.find(p => p.name === 'Moon')?.sign || 'Unknown',
      ascendant: planets.find(p => p.name === 'Ascendant')?.sign || 'Unknown',
      source: 'moshier-de404'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Log detailed error server-side only
    console.error("Error calculating chart:", error);
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to calculate birth chart. Please check your input and try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Calculate Ascendant using standard astronomical formula
function calculateAscendant(
  year: number, month: number, day: number,
  utcHour: number, minute: number,
  latitude: number, longitude: number
): number {
  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;

  // Calculate Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  const jd = jdn + (utcHour + minute / 60) / 24 - 0.5;
  const d = jd - 2451545.0;
  const T = d / 36525;

  // Sidereal time at Greenwich (in degrees)
  const GMST = ((280.46061837 + 360.98564736629 * d + 0.000387933 * T * T) % 360 + 360) % 360;
  
  // Local sidereal time
  const LST = ((GMST + longitude) % 360 + 360) % 360;
  
  // Obliquity of the ecliptic
  const eps = 23.439291 - 0.0130042 * T;
  const eps_rad = eps * DEG_TO_RAD;
  const lat_rad = latitude * DEG_TO_RAD;
  const LST_rad = LST * DEG_TO_RAD;
  
  // Calculate ascendant using the standard formula
  const ascY = Math.cos(LST_rad);
  const ascX = -(Math.sin(LST_rad) * Math.cos(eps_rad) + Math.tan(lat_rad) * Math.sin(eps_rad));
  
  let ascendant = Math.atan2(ascY, ascX) * RAD_TO_DEG;
  ascendant = ((ascendant % 360) + 360) % 360;
  
  // Quadrant adjustment for proper ascendant placement
  if (LST >= 0 && LST < 180) {
    if (ascendant < 180) ascendant = ((ascendant + 180) % 360 + 360) % 360;
  } else {
    if (ascendant >= 180) ascendant = ((ascendant - 180) % 360 + 360) % 360;
  }

  return ascendant;
}
