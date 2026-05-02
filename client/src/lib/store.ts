/**
 * Parvaz Pulse - Local Data Store
 * Offline-first data management using localStorage
 * 
 * Design Philosophy: Ethereal Minimalism
 * - Simple, meditative data structure
 * - No complex state management
 * - Pure localStorage persistence
 */

export interface MentalState {
  energy: number; // 0-100
  focus: number; // 0-100
  stress: number; // 0-100
  motivation: number; // 0-100
  sleepQuality: number; // 0-100
  discipline: number; // 0-100
  mentalClarity: number; // 0-100
  overwhelm: number; // 0-100
  socialBattery: number; // 0-100
  emotionalState: number; // 0-100 (0=sad, 50=neutral, 100=happy)
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  nightReflection: Partial<MentalState>;
  notes?: string;
  enteredAt?: string; // ISO timestamp when user actually entered data
  isUserEntered?: boolean; // Flag to indicate user has entered data
}

export interface BrainDump {
  text: string;
  timestamp: string; // ISO string
}

export interface SOSLog {
  [date: string]: number; // date: YYYY-MM-DD, count
}

export interface AppSettings {
  musicEnabled: boolean;
  musicVolume: number; // 0-100
  selectedTrack: 'ambient' | 'nature' | 'piano' | 'islamic1' | 'islamic2' | 'custom' | 'none';
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
  lastRefreshDate: string; // YYYY-MM-DD
  reminderEnabled: boolean;
  lastReminderDate: string; // YYYY-MM-DD to track if reminder was shown today
}

export interface ExperimentEntry {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  hypothesis: string;
  results: string;
  active: boolean;
}

export interface MoodCanvasEntry {
  id: string;
  date: string;
  mood: string;
  content: string;
  notes?: string;
  voiceNote?: string; // Base64 encoded audio data
  voiceNoteDuration?: number; // Duration in seconds
  textNotes?: Array<{ id: string; text: string; x: number; y: number; size: number; width?: number; height?: number }>;
  stickers?: Array<{ id: string; emoji: string; x: number; y: number; rotation: number; size: number }>;
  timestamp: number;
}

const STORAGE_KEYS = {
  ENTRIES: 'parvaz_entries',
  SETTINGS: 'parvaz_settings',
  EXPERIMENTS: 'parvaz_experiments',
  MOOD_CANVAS: 'parvaz_mood_canvas',
  LAST_SAVE: 'parvaz_last_save',
  BRAIN_DUMPS: 'parvaz-brain-dumps',
  SOS_LOG: 'parvaz-sos-log',
};

const DEFAULT_SETTINGS: AppSettings = {
  musicEnabled: true,
  musicVolume: 40,
  selectedTrack: 'ambient',
  notificationsEnabled: true,
  theme: 'light',
  lastRefreshDate: new Date().toISOString().split('T')[0],
  reminderEnabled: true,
  lastReminderDate: '',
};

const DEFAULT_STATE: MentalState = {
  energy: 50,
  focus: 50,
  stress: 50,
  motivation: 50,
  sleepQuality: 50,
  discipline: 50,
  mentalClarity: 50,
  overwhelm: 50,
  socialBattery: 50,
  emotionalState: 50,
};

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get all entries
export function getAllEntries(): DayEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load entries:', e);
    return [];
  }
}

// Check if current time is after 5 PM
export function isAfter5PM(): boolean {
  const now = new Date();
  return now.getHours() >= 17; // 17:00 is 5 PM
}

// Get today's entry or create new one
export function getTodayEntry(): DayEntry {
  const entries = getAllEntries();
  const today = getTodayDate();
  let entry = entries.find((e) => e.date === today);

  if (!entry) {
    entry = {
      date: today,
      nightReflection: {},
      notes: '',
      isUserEntered: false,
    };
  }

  return entry;
}

// Save entry (only if after 5 PM)
export function saveEntry(entry: DayEntry): void {
  // Check if it's after 5 PM
  if (!isAfter5PM()) {
    console.warn('Entries can only be saved after 5 PM');
    return;
  }

  const entries = getAllEntries();
  const index = entries.findIndex((e) => e.date === entry.date);

  // Mark as user-entered and record timestamp
  const entryToSave = {
    ...entry,
    enteredAt: new Date().toISOString(),
    isUserEntered: true,
  };

  if (index >= 0) {
    entries[index] = entryToSave;
  } else {
    entries.push(entryToSave);
  }

  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

// Get mood description based on emotional state
export function getMoodDescription(emotionalState: number): string {
  if (emotionalState < 20) return 'Overwhelmed';
  if (emotionalState < 35) return 'Struggling';
  if (emotionalState < 50) return 'Neutral';
  if (emotionalState < 65) return 'Good';
  if (emotionalState < 80) return 'Happy';
  return 'Joyful';
}

// Get state description
export function getStateDescription(value: number): string {
  if (value < 20) return 'Very Low';
  if (value < 40) return 'Low';
  if (value < 60) return 'Moderate';
  if (value < 80) return 'High';
  return 'Very High';
}

// Calculate overall wellbeing score
export function calculateWellbeingScore(state: Partial<MentalState>): number {
  const values = Object.values(state).filter((v) => typeof v === 'number') as number[];
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// Get wellbeing status
export function getWellbeingStatus(score: number): string {
  if (score < 20) return 'Critical';
  if (score < 40) return 'Needs Attention';
  if (score < 60) return 'Moderate';
  if (score < 80) return 'Good';
  return 'Excellent';
}

// Brain Dump functions
export function getBrainDumps(): BrainDump[] {
  const data = localStorage.getItem(STORAGE_KEYS.BRAIN_DUMPS);
  return data ? JSON.parse(data) : [];
}

export function saveBrainDump(text: string): void {
  const dumps = getBrainDumps();
  dumps.push({ text, timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.BRAIN_DUMPS, JSON.stringify(dumps));
  syncAllToFirestore();
}

export function deleteBrainDump(index: number): void {
  const dumps = getBrainDumps();
  dumps.splice(index, 1);
  localStorage.setItem(STORAGE_KEYS.BRAIN_DUMPS, JSON.stringify(dumps));
  syncAllToFirestore();
}

export function clearAllBrainDumps(): void {
  localStorage.setItem(STORAGE_KEYS.BRAIN_DUMPS, JSON.stringify([]));
  syncAllToFirestore();
}

// SOS functions
export function getSOSLog(): SOSLog {
  const data = localStorage.getItem(STORAGE_KEYS.SOS_LOG);
  return data ? JSON.parse(data) : {};
}

export function incrementSOSCount(): void {
  const log = getSOSLog();
  const today = new Date().toISOString().split('T')[0];
  log[today] = (log[today] || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.SOS_LOG, JSON.stringify(log));
  syncAllToFirestore();
}

export function getTodaySOSCount(): number {
  const log = getSOSLog();
  const today = new Date().toISOString().split('T')[0];
  return log[today] || 0;
}

// Settings management
export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(updates: Partial<AppSettings>): void {
  const current = getSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
}

// Experiments management
export function getAllExperiments(): ExperimentEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPERIMENTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load experiments:', e);
    return [];
  }
}

export function saveExperiment(experiment: ExperimentEntry): void {
  const experiments = getAllExperiments();
  const index = experiments.findIndex((e) => e.id === experiment.id);

  if (index >= 0) {
    experiments[index] = experiment;
  } else {
    experiments.push(experiment);
  }

  localStorage.setItem(STORAGE_KEYS.EXPERIMENTS, JSON.stringify(experiments));
}

export function deleteExperiment(id: string): void {
  const experiments = getAllExperiments().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXPERIMENTS, JSON.stringify(experiments));
}

// Daily refresh check
export function checkAndRefreshDay(): boolean {
  const settings = getSettings();
  const today = getTodayDate();

  if (settings.lastRefreshDate !== today) {
    updateSettings({ lastRefreshDate: today });
    return true;
  }

  return false;
}

// Get focus weather based on mental state
export function getFocusWeather(state: Partial<MentalState>): 'calm' | 'focused' | 'overwhelmed' | 'balanced' {
  const focus = state.focus ?? 50;
  const stress = state.stress ?? 50;
  const overwhelm = state.overwhelm ?? 50;
  const clarity = state.mentalClarity ?? 50;

  if (overwhelm > 70) return 'overwhelmed';
  if (focus > 75 && stress < 40 && clarity > 70) return 'focused';
  if (stress < 30 && clarity > 70) return 'calm';
  return 'balanced';
}

// Mood Canvas management
export function getAllMoodCanvasEntries(): MoodCanvasEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MOOD_CANVAS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load mood canvas entries:', e);
    return [];
  }
}

export function saveMoodCanvasEntry(entry: MoodCanvasEntry): void {
  const entries = getAllMoodCanvasEntries();
  const index = entries.findIndex((e) => e.id === entry.id);

  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }

  localStorage.setItem(STORAGE_KEYS.MOOD_CANVAS, JSON.stringify(entries));
  localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
}

export function deleteMoodCanvasEntry(id: string): void {
  const entries = getAllMoodCanvasEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.MOOD_CANVAS, JSON.stringify(entries));
}

// Auto-save helper
export function autoSave(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
  } catch (e) {
    console.error('Auto-save failed:', e);
  }
}

// Get last save timestamp
export function getLastSaveTime(): string {
  return localStorage.getItem(STORAGE_KEYS.LAST_SAVE) || new Date().toISOString();
}

// ── Firebase sync ─────────────────────────────────────────────────────────────
import { saveAllToFirestore, loadAllFromFirestore } from './firebase';

const KEYS = ['parvaz-entries', 'parvaz-settings', 'parvaz-experiments', 'parvaz-mood-canvas'];
let _fbTimer: ReturnType<typeof setTimeout> | null = null;

export function syncAllToFirestore(): void {
  if (_fbTimer) clearTimeout(_fbTimer);
  _fbTimer = setTimeout(() => {
    const state: Record<string, any> = {};
    KEYS.forEach(k => {
      try { state[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch {}
    });
    saveAllToFirestore(state);
  }, 2000);
}

export async function loadFromFirestoreToLocal(): Promise<boolean> {
  try {
    const remote = await loadAllFromFirestore();
    if (!remote) return false;
    KEYS.forEach(k => {
      if (remote[k] !== null && remote[k] !== undefined) {
        localStorage.setItem(k, JSON.stringify(remote[k]));
      }
    });
    return true;
  } catch {
    return false;
  }
}
