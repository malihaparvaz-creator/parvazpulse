import React, { useEffect, useState } from 'react';
import { MentalState, getTodayEntry, saveEntry, DayEntry, checkAndRefreshDay, isAfter5PM } from '@/lib/store';
import { MentalStateSlider } from '@/components/MentalStateSlider';
import { FocusWeatherSystem } from '@/components/FocusWeatherSystem';
import { useMusic } from '@/contexts/MusicContext';
import { Settings, Music } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

function getTimeBasedGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Good Evening', emoji: '🌙' };
}

const MENTAL_STATE_FIELDS: Array<{ key: keyof MentalState; label: string; emoji: string; color: 'lavender'|'blue'|'sage'|'peach'|'coral' }> = [
  { key: 'energy', label: 'Energy', emoji: '✨', color: 'coral' },
  { key: 'focus', label: 'Focus', emoji: '🎯', color: 'blue' },
  { key: 'stress', label: 'Stress', emoji: '🌊', color: 'peach' },
  { key: 'motivation', label: 'Motivation', emoji: '🌿', color: 'sage' },
  { key: 'sleepQuality', label: 'Sleep Quality', emoji: '🌙', color: 'lavender' },
  { key: 'discipline', label: 'Discipline', emoji: '🔮', color: 'coral' },
  { key: 'mentalClarity', label: 'Mental Clarity', emoji: '💎', color: 'blue' },
  { key: 'overwhelm', label: 'Overwhelm', emoji: '🌀', color: 'peach' },
  { key: 'socialBattery', label: 'Social Battery', emoji: '🌸', color: 'sage' },
  { key: 'emotionalState', label: 'Emotional State', emoji: '💫', color: 'lavender' },
];

const NAV_BUTTONS = [
  { path: '/day-map', emoji: '🌙', label: 'Night Map', gradient: 'from-[#FFE5CC] to-[#FFD4B3] hover:from-[#FFD4B3] hover:to-[#FFC399]' },
  { path: '/patterns', emoji: '📈', label: 'Patterns', gradient: 'from-[#D4E8F7] to-[#C5D9F1] hover:from-[#C5D9F1] hover:to-[#B6CAEB]' },
  { path: '/analytics', emoji: '📉', label: 'Analytics', gradient: 'from-[#D9E8D9] to-[#C5D9C5] hover:from-[#C5D9C5] hover:to-[#B1CFB1]' },
  { path: '/weekly', emoji: '📋', label: 'Weekly', gradient: 'from-[#E8D9E8] to-[#D9C5D9] hover:from-[#D9C5D9] hover:to-[#CAB1CA]' },
  { path: '/experiments', emoji: '🧪', label: 'Experiments', gradient: 'from-[#FFE5D9] to-[#FFD4C5] hover:from-[#FFD4C5] hover:to-[#FFC3B1]' },
  { path: '/mood-canvas', emoji: '🎨', label: 'Mood Canvas', gradient: 'from-[#D9F0E8] to-[#C5E8D9] hover:from-[#C5E8D9] hover:to-[#B1E0CA]' },
  { path: '/reset-mind', emoji: '🧘', label: 'Reset Mind', gradient: 'from-[#F0E8D9] to-[#E8D9C5] hover:from-[#E8D9C5] hover:to-[#D9CAB1]' },
];

export default function Home() {
  const [entry, setEntry] = useState<DayEntry>(getTodayEntry());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());
  const [canEnter, setCanEnter] = useState(isAfter5PM());
  const [, navigate] = useLocation();
  const { isPlaying, volume } = useMusic();

  useEffect(() => {
    const d = checkAndRefreshDay();
    if (d) setEntry(getTodayEntry());
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
        const d = checkAndRefreshDay();
        if (d) setEntry(getTodayEntry());
      }
      setGreeting(getTimeBasedGreeting());
      setCanEnter(isAfter5PM());
    }, 60000);
    return () => clearInterval(iv);
  }, [currentDate]);

  useEffect(() => {
    if (canEnter && entry.isUserEntered) saveEntry(entry);
  }, [entry, canEnter]);

  const handleStateChange = (field: keyof MentalState, value: number) => {
    if (!canEnter) { toast.error('Entries can only be made after 5 PM'); return; }
    setEntry(prev => ({ ...prev, nightReflection: { ...prev.nightReflection, [field]: value }, isUserEntered: true }));
  };

  const currentState = entry.nightReflection || {};

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') return;
        const todayEntry = getTodayEntry();
        const hasLogged = !!(todayEntry as any)?.enteredAt;
        if (hasLogged) return;
        const now = new Date();
        const sevenPM = new Date();
        sevenPM.setHours(19, 0, 0, 0);
        const delayMs = sevenPM.getTime() - now.getTime();
        if (delayMs <= 0) return;
        navigator.serviceWorker.ready.then(reg => {
          reg.active?.postMessage({ type: 'SCHEDULE_LOG_REMINDER', delayMs });
        });
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E8E4F3] soft-shadow">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Parvaz Pulse</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Night Reflection</p>
              <span className="text-xs text-muted-foreground">•</span>
              <p className="text-xs text-muted-foreground">{currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all">
              <Music className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">{volume}%</span>
              <span className="text-xs">{isPlaying ? '🎵' : '🔇'}</span>
            </div>
            <button onClick={() => navigate('/settings')} className="p-2 hover:bg-[#E8E4F3]/30 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        <FocusWeatherSystem mentalState={currentState} greeting={greeting} canEnter={canEnter} />

        <section className="space-y-4 md:space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">How are you feeling tonight?</h2>
          {/* Responsive grid: 1 col phone, 2 col tablet portrait, 3-4 col tablet landscape / desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {MENTAL_STATE_FIELDS.map(field => (
              <MentalStateSlider
                key={field.key}
                label={field.label}
                emoji={field.emoji}
                value={currentState[field.key] || 0}
                onChange={v => handleStateChange(field.key, v)}
                color={field.color}
                disabled={!canEnter}
              />
            ))}
          </div>
        </section>

        {/* Navigation — wraps nicely on all screen sizes */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pb-8">
          {NAV_BUTTONS.map(btn => (
            <button key={btn.path} onClick={() => navigate(btn.path)}
              className={`px-4 py-3 md:py-3 rounded-xl bg-gradient-to-r ${btn.gradient} transition-all font-medium text-foreground soft-shadow text-sm md:text-base`}>
              {btn.emoji} {btn.label}
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
