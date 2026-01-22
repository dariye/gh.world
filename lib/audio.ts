/**
 * Generative commit sounds using Web Audio API
 *
 * Design principles:
 * - Off by default (respect user attention)
 * - Ambient, not melodic (Brian Eno, not Mozart)
 * - Never overwhelming (max 4 notes/second, max 8 simultaneous)
 */

// Waveform mapping by language family
const LANGUAGE_WAVEFORMS: Record<string, OscillatorType> = {
  // Soft, warm
  TypeScript: 'sine',
  JavaScript: 'sine',
  // Mellow
  Python: 'triangle',
  // Crisp (will apply filter)
  Rust: 'sawtooth',
  Go: 'sawtooth',
  // Solid (will soften)
  Java: 'square',
  'C#': 'square',
  C: 'square',
  'C++': 'square',
  // Default
  Other: 'sine',
};

// Pentatonic scale frequencies (C, D, E, G, A)
// C3 to C5 range, mapped from latitude -90 to +90
const PENTATONIC_FREQUENCIES = [
  // C3 octave
  130.81, 146.83, 164.81, 196.00, 220.00,
  // C4 octave
  261.63, 293.66, 329.63, 392.00, 440.00,
  // C5 octave
  523.25, 587.33, 659.25, 783.99, 880.00,
];

// State
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeOscillators = 0;
let lastNoteTime = 0;

const MAX_OSCILLATORS = 8;
const MIN_NOTE_INTERVAL_MS = 250; // Max 4 notes/second
const NOTE_DURATION_MS = 400;
const ATTACK_TIME = 0.02;
const RELEASE_TIME = 0.3;

// Local storage keys
const STORAGE_KEY_ENABLED = 'ghworld:sound:enabled';
const STORAGE_KEY_VOLUME = 'ghworld:sound:volume';

/**
 * Initialize AudioContext on first user interaction
 * Must be called from a user gesture (click/touch)
 */
export function initAudio(): boolean {
  if (audioContext) return true;

  try {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);

    // Restore volume from storage
    const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (savedVolume !== null) {
      masterGain.gain.value = parseFloat(savedVolume);
    } else {
      masterGain.gain.value = 0.3; // Default volume
    }

    return true;
  } catch {
    console.warn('Web Audio API not supported');
    return false;
  }
}

/**
 * Check if sound is enabled (from localStorage)
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
}

/**
 * Toggle sound on/off
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));

  if (enabled && !audioContext) {
    initAudio();
  }
}

/**
 * Get current volume (0-1)
 */
export function getVolume(): number {
  if (typeof window === 'undefined') return 0.3;
  const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
  return saved !== null ? parseFloat(saved) : 0.3;
}

/**
 * Set volume (0-1)
 */
export function setVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
  }

  if (masterGain) {
    masterGain.gain.value = clamped;
  }
}

/**
 * Map latitude to pentatonic frequency
 * -90° to +90° maps to C3-C5 pentatonic scale
 */
function latitudeToFrequency(latitude: number): number {
  // Normalize latitude from [-90, 90] to [0, 1]
  const normalized = (latitude + 90) / 180;
  // Map to frequency index
  const index = Math.floor(normalized * (PENTATONIC_FREQUENCIES.length - 1));
  return PENTATONIC_FREQUENCIES[Math.max(0, Math.min(index, PENTATONIC_FREQUENCIES.length - 1))];
}

/**
 * Get waveform type for a language
 */
function getWaveform(language: string | null): OscillatorType {
  if (!language) return 'sine';
  return LANGUAGE_WAVEFORMS[language] || LANGUAGE_WAVEFORMS.Other;
}

/**
 * Play a note for a commit
 *
 * @param language - Programming language (determines timbre)
 * @param latitude - Latitude of commit (determines pitch)
 * @param volumeOverride - Optional volume multiplier (0-1)
 * @returns true if note was played, false if throttled/skipped
 */
export function playNote(
  language: string | null,
  latitude: number,
  volumeOverride?: number
): boolean {
  // Check if enabled
  if (!isSoundEnabled()) return false;

  // Ensure audio is initialized
  if (!audioContext || !masterGain) {
    if (!initAudio()) return false;
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext!.state === 'suspended') {
    audioContext!.resume();
  }

  // Throttle: max 4 notes/second
  const now = Date.now();
  if (now - lastNoteTime < MIN_NOTE_INTERVAL_MS) {
    return false;
  }

  // Pool limit: max 8 simultaneous oscillators
  if (activeOscillators >= MAX_OSCILLATORS) {
    return false;
  }

  lastNoteTime = now;
  activeOscillators++;

  const ctx = audioContext!;
  const currentTime = ctx.currentTime;

  // Create oscillator
  const oscillator = ctx.createOscillator();
  oscillator.type = getWaveform(language);
  oscillator.frequency.value = latitudeToFrequency(latitude);

  // Create gain envelope for this note
  const noteGain = ctx.createGain();
  const volume = volumeOverride !== undefined ? volumeOverride : 1;

  // ADSR-like envelope: attack, sustain, release
  noteGain.gain.setValueAtTime(0, currentTime);
  noteGain.gain.linearRampToValueAtTime(0.15 * volume, currentTime + ATTACK_TIME);
  noteGain.gain.setValueAtTime(0.15 * volume, currentTime + NOTE_DURATION_MS / 1000 - RELEASE_TIME);
  noteGain.gain.linearRampToValueAtTime(0, currentTime + NOTE_DURATION_MS / 1000);

  // Apply filter for harsh waveforms (sawtooth, square)
  if (oscillator.type === 'sawtooth' || oscillator.type === 'square') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // Soften harsh harmonics
    filter.Q.value = 1;

    oscillator.connect(filter);
    filter.connect(noteGain);
  } else {
    oscillator.connect(noteGain);
  }

  noteGain.connect(masterGain!);

  // Start and stop
  oscillator.start(currentTime);
  oscillator.stop(currentTime + NOTE_DURATION_MS / 1000);

  // Cleanup
  oscillator.onended = () => {
    activeOscillators--;
    oscillator.disconnect();
    noteGain.disconnect();
  };

  return true;
}

/**
 * Play sound for a batch of new commits
 * Respects throttling - may not play all commits
 */
export function playCommitSounds(
  commits: Array<{ language?: string | null; coordinates?: number[] }>
): number {
  let played = 0;

  for (const commit of commits) {
    if (commit.coordinates && commit.coordinates.length >= 2) {
      const latitude = commit.coordinates[0];
      if (playNote(commit.language ?? null, latitude)) {
        played++;
      }
    }
  }

  return played;
}
