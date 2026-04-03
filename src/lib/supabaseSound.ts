const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SOUND_REQUEST_TIMEOUT_MS = 15_000;

interface SoundRequest {
  planetName: string;
  prompt: string;
}

interface SoundErrorResponse {
  error?: string;
  unavailable?: boolean;
}

async function readSoundError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null) as SoundErrorResponse | null;
    if (payload?.error) {
      return payload.error;
    }
  }

  const text = await response.text().catch(() => '');
  return text || 'Unable to generate sound right now.';
}

export async function requestGeneratedSound({ planetName, prompt }: SoundRequest): Promise<Blob> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Sound generation is not configured.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SOUND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-planet-sound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ planetName, prompt }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await readSoundError(response));
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('audio/')) {
      throw new Error(await readSoundError(response));
    }

    return response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Sound generation timed out. Please try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
