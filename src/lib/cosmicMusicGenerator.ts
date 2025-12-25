import * as Tone from 'tone';

// Musical modes and scales for each zodiac sign
const zodiacScales: Record<string, number[]> = {
  'Aries': [0, 1, 4, 5, 7, 8, 10], // Phrygian
  'Taurus': [0, 2, 4, 5, 7, 9, 11], // Ionian (Major)
  'Gemini': [0, 2, 4, 5, 7, 9, 10], // Mixolydian
  'Cancer': [0, 2, 3, 5, 7, 8, 10], // Aeolian (Natural Minor)
  'Leo': [0, 2, 4, 6, 7, 9, 11], // Lydian
  'Virgo': [0, 2, 3, 5, 7, 9, 10], // Dorian
  'Libra': [0, 2, 4, 5, 7, 9, 11], // Ionian
  'Scorpio': [0, 1, 3, 5, 6, 8, 10], // Locrian
  'Sagittarius': [0, 2, 4, 5, 7, 9, 10], // Mixolydian
  'Capricorn': [0, 2, 3, 5, 7, 9, 10], // Dorian
  'Aquarius': [0, 2, 4, 6, 7, 9, 11], // Lydian
  'Pisces': [0, 1, 4, 5, 7, 8, 10], // Phrygian
};

// Root notes for each sign (MIDI note numbers)
const zodiacRoots: Record<string, number> = {
  'Aries': 57, // A3
  'Taurus': 53, // F3
  'Gemini': 55, // G3
  'Cancer': 57, // A3
  'Leo': 50, // D3
  'Virgo': 50, // D3
  'Libra': 58, // Bb3
  'Scorpio': 59, // B3
  'Sagittarius': 52, // E3
  'Capricorn': 48, // C3
  'Aquarius': 54, // F#3
  'Pisces': 52, // E3
};

// Tempo characteristics for each sign
const zodiacTempos: Record<string, number> = {
  'Aries': 120,
  'Taurus': 60,
  'Gemini': 100,
  'Cancer': 70,
  'Leo': 85,
  'Virgo': 80,
  'Libra': 75,
  'Scorpio': 55,
  'Sagittarius': 110,
  'Capricorn': 72,
  'Aquarius': 95,
  'Pisces': 65,
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getScaleNote(root: number, scale: number[], degree: number): number {
  const octave = Math.floor(degree / scale.length);
  const scaleIndex = ((degree % scale.length) + scale.length) % scale.length;
  return root + octave * 12 + scale[scaleIndex];
}

export interface CosmicMusicOptions {
  sunSign: string;
  moonSign: string;
  duration?: number; // in seconds
  onProgress?: (progress: number) => void;
}

export async function generateCosmicMusic(options: CosmicMusicOptions): Promise<Blob> {
  const { sunSign, moonSign, duration = 30, onProgress } = options;
  
  // Get scales and roots for the signs
  const sunScale = zodiacScales[sunSign] || zodiacScales['Leo'];
  const moonScale = zodiacScales[moonSign] || zodiacScales['Cancer'];
  const sunRoot = zodiacRoots[sunSign] || 57;
  const moonRoot = zodiacRoots[moonSign] || 57;
  const tempo = zodiacTempos[sunSign] || 80;
  
  // Create offline context for rendering
  const offlineContext = new Tone.OfflineContext(2, duration, 44100);
  await Tone.setContext(offlineContext);
  
  // Set up reverb and delay for cosmic atmosphere
  const reverb = new Tone.Reverb({
    decay: 8,
    wet: 0.7,
  });
  await reverb.generate();
  reverb.toDestination();
  
  const delay = new Tone.FeedbackDelay({
    delayTime: '8n',
    feedback: 0.3,
    wet: 0.4,
  });
  delay.connect(reverb);
  
  // Create ethereal pad synth for sustained tones
  const padSynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 3,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 2,
      decay: 1,
      sustain: 0.8,
      release: 4,
    },
    modulation: { type: 'sine' },
    modulationEnvelope: {
      attack: 0.5,
      decay: 0.5,
      sustain: 1,
      release: 2,
    },
  });
  padSynth.volume.value = -12;
  padSynth.connect(delay);
  
  // Create bell-like synth for melodic elements
  const bellSynth = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 4,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.01,
      decay: 2,
      sustain: 0.1,
      release: 3,
    },
    modulation: { type: 'square' },
    modulationEnvelope: {
      attack: 0.5,
      decay: 0.5,
      sustain: 1,
      release: 0.5,
    },
  });
  bellSynth.volume.value = -18;
  bellSynth.connect(reverb);
  
  // Create sub bass for grounding
  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 1,
      decay: 0.5,
      sustain: 0.9,
      release: 3,
    },
    filterEnvelope: {
      attack: 0.5,
      decay: 0.5,
      sustain: 0.5,
      release: 2,
      baseFrequency: 100,
      octaves: 1,
    },
  });
  bassSynth.volume.value = -15;
  bassSynth.toDestination();
  
  // Transport setup
  Tone.getTransport().bpm.value = tempo;
  
  // Schedule music generation
  const now = 0;
  const beatLength = 60 / tempo;
  
  // Generate pad chord progression (uses sun sign scale)
  for (let bar = 0; bar < Math.floor(duration / (4 * beatLength)); bar++) {
    const barStart = bar * 4 * beatLength;
    
    // Build chord from scale
    const rootDegree = [0, 3, 4, 2, 5][bar % 5];
    const chordNotes = [
      midiToFreq(getScaleNote(sunRoot, sunScale, rootDegree)),
      midiToFreq(getScaleNote(sunRoot, sunScale, rootDegree + 2)),
      midiToFreq(getScaleNote(sunRoot, sunScale, rootDegree + 4)),
    ];
    
    padSynth.triggerAttackRelease(
      chordNotes,
      '2n',
      barStart
    );
  }
  
  // Generate melodic bell notes (uses moon sign scale for emotional depth)
  const melodySeed = Math.random();
  for (let beat = 0; beat < Math.floor(duration / beatLength); beat++) {
    if (Math.random() > 0.6) { // Sparse melody
      const beatTime = beat * beatLength;
      const melodicDegree = Math.floor((Math.sin(beat * 0.7 + melodySeed * 10) + 1) * 4);
      const noteOctave = Math.floor(Math.random() * 2) + 1;
      const note = midiToFreq(getScaleNote(moonRoot + 12, moonScale, melodicDegree + noteOctave * 7));
      
      bellSynth.triggerAttackRelease(
        note,
        '4n',
        beatTime
      );
    }
  }
  
  // Generate bass notes (fundamental grounding)
  for (let bar = 0; bar < Math.floor(duration / (4 * beatLength)); bar++) {
    const barStart = bar * 4 * beatLength;
    const bassDegree = [0, 4, 3, 0][bar % 4];
    const bassNote = midiToFreq(getScaleNote(sunRoot - 12, sunScale, bassDegree));
    
    bassSynth.triggerAttackRelease(bassNote, '1n', barStart);
  }
  
  // Report progress during render
  onProgress?.(50);
  
  // Render the audio
  const buffer = await offlineContext.render();
  
  onProgress?.(80);
  
  // Convert to WAV blob
  const wavBlob = await bufferToWav(buffer);
  
  onProgress?.(100);
  
  // Cleanup
  padSynth.dispose();
  bellSynth.dispose();
  bassSynth.dispose();
  reverb.dispose();
  delay.dispose();
  
  return wavBlob;
}

// Convert AudioBuffer to WAV Blob
async function bufferToWav(buffer: Tone.ToneAudioBuffer): Promise<Blob> {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  
  // Get the raw audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  // Create WAV file
  const wavBuffer = createWavBuffer(channels, sampleRate, length);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function createWavBuffer(channels: Float32Array[], sampleRate: number, length: number): ArrayBuffer {
  const numberOfChannels = channels.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write audio data (interleaved)
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
