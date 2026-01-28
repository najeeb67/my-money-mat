import { useCallback, useRef } from 'react';

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
}

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate a simple tone
const generateTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): Promise<void> => {
  return new Promise((resolve) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    setTimeout(resolve, duration * 1000);
  });
};

// Generate celebration sound (ascending notes)
const generateCelebrationSound = async (volume: number = 0.3): Promise<void> => {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  for (let i = 0; i < notes.length; i++) {
    await generateTone(notes[i], 0.15, 'sine', volume);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

// Generate click sound
const generateClickSound = (volume: number = 0.2): void => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.05);
};

// Generate success sound (two-tone positive)
const generateSuccessSound = async (volume: number = 0.25): Promise<void> => {
  await generateTone(440, 0.1, 'sine', volume); // A4
  await new Promise(resolve => setTimeout(resolve, 50));
  await generateTone(880, 0.2, 'sine', volume); // A5
};

// Generate pop sound
const generatePopSound = (volume: number = 0.15): void => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.08);
};

// Generate whoosh sound (for refreshing)
const generateWhooshSound = (volume: number = 0.2): void => {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 3));
  }

  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  source.start(ctx.currentTime);
};

export const useSoundEffects = () => {
  const enabled = useRef(true);

  const setEnabled = useCallback((value: boolean) => {
    enabled.current = value;
  }, []);

  const playClick = useCallback((options: SoundOptions = {}) => {
    if (!enabled.current) return;
    try {
      generateClickSound(options.volume ?? 0.2);
    } catch (e) {
      console.warn('Could not play click sound:', e);
    }
  }, []);

  const playSuccess = useCallback(async (options: SoundOptions = {}) => {
    if (!enabled.current) return;
    try {
      await generateSuccessSound(options.volume ?? 0.25);
    } catch (e) {
      console.warn('Could not play success sound:', e);
    }
  }, []);

  const playCelebration = useCallback(async (options: SoundOptions = {}) => {
    if (!enabled.current) return;
    try {
      await generateCelebrationSound(options.volume ?? 0.3);
    } catch (e) {
      console.warn('Could not play celebration sound:', e);
    }
  }, []);

  const playPop = useCallback((options: SoundOptions = {}) => {
    if (!enabled.current) return;
    try {
      generatePopSound(options.volume ?? 0.15);
    } catch (e) {
      console.warn('Could not play pop sound:', e);
    }
  }, []);

  const playRefresh = useCallback((options: SoundOptions = {}) => {
    if (!enabled.current) return;
    try {
      generateWhooshSound(options.volume ?? 0.2);
    } catch (e) {
      console.warn('Could not play refresh sound:', e);
    }
  }, []);

  return {
    playClick,
    playSuccess,
    playCelebration,
    playPop,
    playRefresh,
    setEnabled,
    isEnabled: () => enabled.current,
  };
};
