/**
 * Parvaz Pulse - Music Context
 * Generates ambient music via Web Audio API (no external CDN needed)
 * Falls back gracefully on any error.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/store';

type TrackType = 'ambient' | 'nature' | 'piano' | 'islamic1' | 'islamic2' | 'custom' | 'none';

interface CustomTrack {
  id: string;
  name: string;
  url: string;
}

interface MusicContextType {
  isPlaying: boolean;
  volume: number;
  currentTrack: TrackType;
  customTracks: CustomTrack[];
  selectedCustomTrack: string | null;
  disabledTracks: Set<string>;
  setVolume: (volume: number) => void;
  setCurrentTrack: (track: TrackType) => void;
  setSelectedCustomTrack: (trackId: string | null) => void;
  togglePlayback: () => void;
  addCustomTrack: (file: File) => Promise<void>;
  removeCustomTrack: (trackId: string) => void;
  deletePresetTrack: (trackId: string) => void;
  getMoodRecommendation: (mood: string) => TrackType;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Mood-based music recommendations
const MOOD_RECOMMENDATIONS: Record<string, TrackType> = {
  Overwhelmed: 'nature',
  Stressed: 'nature',
  Anxious: 'piano',
  Tired: 'ambient',
  Calm: 'ambient',
  Focused: 'piano',
  Creative: 'ambient',
  Energetic: 'piano',
  Sad: 'piano',
  Happy: 'ambient',
  Balanced: 'ambient',
  Confused: 'nature',
};

// ─── Web Audio Synthesis ───────────────────────────────────────────────────

type AudioEngine = {
  stop: () => void;
  setVolume: (v: number) => void;
};

function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Smooth drone: layered sine waves at harmonic intervals */
function playAmbient(ctx: AudioContext, masterGain: GainNode): () => void {
  const freqs = [55, 110, 165, 220, 330];
  const oscs: OscillatorNode[] = [];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.06 / (i + 1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    oscs.push(osc);
  });
  // slow LFO wobble
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.1;
  lfoGain.gain.value = 2;
  lfo.connect(lfoGain);
  lfoGain.connect(oscs[1].frequency);
  lfo.start();
  return () => {
    oscs.forEach(o => { try { o.stop(); } catch {} });
    try { lfo.stop(); } catch {}
  };
}

/** Nature: white noise + gentle low-pass filter */
function playNature(ctx: AudioContext, masterGain: GainNode): () => void {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  source.connect(filter);
  filter.connect(masterGain);
  source.start();
  return () => { try { source.stop(); } catch {} };
}

/** Piano: plucked sine tones with decay, cycling pentatonic scale */
function playPiano(ctx: AudioContext, masterGain: GainNode): () => void {
  const scale = [261.63, 293.66, 329.63, 392, 440, 523.25]; // C major penta
  let stopped = false;
  let timeouts: ReturnType<typeof setTimeout>[] = [];

  const pluck = (freq: number, when: number) => {
    const osc = ctx.createOscillator();
    const envGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    envGain.gain.setValueAtTime(0, ctx.currentTime + when);
    envGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + when + 0.01);
    envGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 1.8);
    osc.connect(envGain);
    envGain.connect(masterGain);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + 2);
  };

  const scheduleLoop = () => {
    if (stopped) return;
    const numNotes = Math.floor(Math.random() * 3) + 2;
    let offset = 0;
    for (let i = 0; i < numNotes; i++) {
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const octave = Math.random() > 0.5 ? 1 : 2;
      pluck(freq * octave, offset);
      offset += Math.random() * 1.2 + 0.6;
    }
    const t = setTimeout(scheduleLoop, (offset + Math.random() * 2 + 1) * 1000);
    timeouts.push(t);
  };

  scheduleLoop();
  return () => {
    stopped = true;
    timeouts.forEach(t => clearTimeout(t));
  };
}

/** Islamic I: pentatonic drone in minor + slow arpeggio */
function playIslamic1(ctx: AudioContext, masterGain: GainNode): () => void {
  // D minor / Hijaz-like: D, Eb, F#, G, A
  const drone = [73.42, 146.83]; // D2, D3
  const melody = [146.83, 155.56, 185, 196, 220]; // D3, Eb3, F#3, G3, A3
  const oscs: OscillatorNode[] = [];

  drone.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0.08 / (i + 1);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    oscs.push(osc);
  });

  let stopped = false;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let idx = 0;

  const arp = () => {
    if (stopped) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = melody[idx % melody.length];
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 1.6);
    idx++;
    const t = setTimeout(arp, (Math.random() * 0.8 + 0.9) * 1000);
    timeouts.push(t);
  };
  arp();

  return () => {
    stopped = true;
    oscs.forEach(o => { try { o.stop(); } catch {} });
    timeouts.forEach(t => clearTimeout(t));
  };
}

/** Islamic II: deeper tone, slower, reverb-like delay */
function playIslamic2(ctx: AudioContext, masterGain: GainNode): () => void {
  // Rast maqam feel: C, D, Eb, F, G, Ab, Bb
  const notes = [130.81, 146.83, 155.56, 174.61, 196, 207.65, 233.08];
  let stopped = false;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let idx = 0;

  // subtle delay for spaciousness
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = 0.45;
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.3;
  delay.connect(feedbackGain);
  feedbackGain.connect(delay);
  delay.connect(masterGain);

  const sing = () => {
    if (stopped) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = notes[idx % notes.length];
    const dur = Math.random() * 1.5 + 1.5;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.15, ctx.currentTime + dur - 0.3);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(delay);
    g.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.1);
    idx++;
    const t = setTimeout(sing, (dur + Math.random() * 0.5 + 0.2) * 1000);
    timeouts.push(t);
  };
  sing();

  return () => {
    stopped = true;
    timeouts.forEach(t => clearTimeout(t));
  };
}

const GENERATORS: Record<string, (ctx: AudioContext, master: GainNode) => () => void> = {
  ambient: playAmbient,
  nature: playNature,
  piano: playPiano,
  islamic1: playIslamic1,
  islamic2: playIslamic2,
};

// ─── Provider ─────────────────────────────────────────────────────────────

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolumeState] = useState(40);
  const [currentTrack, setCurrentTrackState] = useState<TrackType>('ambient');
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [selectedCustomTrack, setSelectedCustomTrack] = useState<string | null>(null);
  const [disabledTracks, setDisabledTracks] = useState<Set<string>>(new Set());

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const stopCurrentRef = useRef<(() => void) | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  // Load settings on mount
  useEffect(() => {
    const settings = getSettings();
    setVolumeState(settings.musicVolume);
    setCurrentTrackState(settings.selectedTrack as TrackType || 'ambient');

    try {
      const stored = localStorage.getItem('parvaz_custom_tracks');
      if (stored) setCustomTracks(JSON.parse(stored));
    } catch {}
    try {
      const stored = localStorage.getItem('parvaz_disabled_tracks');
      if (stored) setDisabledTracks(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  // Start audio engine on first user interaction
  useEffect(() => {
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const ctx = createAudioContext();
      if (!ctx) return;
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = volume / 100;
      master.connect(ctx.destination);
      masterGainRef.current = master;
      if (isPlaying) startTrack(currentTrack);
    };
    document.addEventListener('click', start, { once: true });
    document.addEventListener('keydown', start, { once: true });
    document.addEventListener('touchstart', start, { once: true });
    return () => {
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('touchstart', start);
    };
  }, []); // eslint-disable-line

  const stopAll = () => {
    if (stopCurrentRef.current) { stopCurrentRef.current(); stopCurrentRef.current = null; }
    if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current = null; }
  };

  const startTrack = (track: TrackType) => {
    stopAll();
    if (track === 'none' || !ctxRef.current || !masterGainRef.current) return;

    if (track === 'custom' && selectedCustomTrack) {
      const t = customTracks.find(t => t.id === selectedCustomTrack);
      if (t) {
        const audio = new Audio(t.url);
        audio.loop = true;
        audio.volume = volume / 100;
        audio.play().catch(() => {});
        customAudioRef.current = audio;
      }
      return;
    }

    const gen = GENERATORS[track];
    if (gen && ctxRef.current.state !== 'closed') {
      // resume if suspended
      ctxRef.current.resume().catch(() => {});
      stopCurrentRef.current = gen(ctxRef.current, masterGainRef.current);
    }
  };

  // React to track change
  useEffect(() => {
    if (!startedRef.current) return;
    if (isPlaying) startTrack(currentTrack);
    else stopAll();
  }, [currentTrack, isPlaying]); // eslint-disable-line

  // Volume change
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume / 100, ctxRef.current!.currentTime, 0.1);
    }
    if (customAudioRef.current) customAudioRef.current.volume = volume / 100;
    updateSettings({ musicVolume: volume });
  }, [volume]);

  const setVolume = (v: number) => setVolumeState(v);

  const setCurrentTrack = (track: TrackType) => {
    setCurrentTrackState(track);
    updateSettings({ selectedTrack: track });
  };

  const togglePlayback = () => {
    if (currentTrack === 'none') { setCurrentTrack('ambient'); setIsPlaying(true); }
    else setIsPlaying(p => !p);
  };

  const addCustomTrack = async (file: File) => {
    const url = URL.createObjectURL(file);
    const newTrack: CustomTrack = { id: `custom_${Date.now()}`, name: file.name.replace(/\.[^/.]+$/, ''), url };
    const updated = [...customTracks, newTrack];
    setCustomTracks(updated);
    localStorage.setItem('parvaz_custom_tracks', JSON.stringify(updated));
    setSelectedCustomTrack(newTrack.id);
    setCurrentTrack('custom');
    setIsPlaying(true);
  };

  const removeCustomTrack = (trackId: string) => {
    const track = customTracks.find(t => t.id === trackId);
    if (track) URL.revokeObjectURL(track.url);
    const updated = customTracks.filter(t => t.id !== trackId);
    setCustomTracks(updated);
    localStorage.setItem('parvaz_custom_tracks', JSON.stringify(updated));
    if (selectedCustomTrack === trackId) { setSelectedCustomTrack(null); setCurrentTrack('ambient'); }
  };

  const deletePresetTrack = (trackId: string) => {
    const nd = new Set(disabledTracks);
    nd.add(trackId);
    setDisabledTracks(nd);
    localStorage.setItem('parvaz_disabled_tracks', JSON.stringify(Array.from(nd)));
    if (currentTrack === trackId) setCurrentTrack('ambient');
  };

  const getMoodRecommendation = (mood: string): TrackType => MOOD_RECOMMENDATIONS[mood] || 'ambient';

  return (
    <MusicContext.Provider value={{
      isPlaying, volume, currentTrack, customTracks,
      selectedCustomTrack, disabledTracks,
      setVolume, setCurrentTrack, setSelectedCustomTrack,
      togglePlayback, addCustomTrack, removeCustomTrack,
      deletePresetTrack, getMoodRecommendation,
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
}
