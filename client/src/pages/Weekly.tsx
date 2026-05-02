import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { getAllEntries, DayEntry } from '@/lib/store';

export default function Weekly() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [weekNumber, setWeekNumber] = useState(0);

  useEffect(() => {
    setEntries(getAllEntries());
  }, []);

  const getWeekEntries = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - weekNumber * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return entries.filter((e) => {
      const entryDate = new Date(e.date + 'T00:00:00');
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  };

  const weekEntries = getWeekEntries();

  const getWeekLabel = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - weekNumber * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const calculateWeeklyAverage = (key: string): number => {
    let sum = 0;
    let count = 0;

    weekEntries.forEach((entry) => {
      if (entry.nightReflection && entry.nightReflection[key as keyof typeof entry.nightReflection] !== undefined) {
        sum += entry.nightReflection[key as keyof typeof entry.nightReflection] as number;
        count++;
      }
    });

    return count > 0 ? Math.round(sum / count) : 0;
  };

  const getWeeklyTrend = (key: string): string => {
    if (weekEntries.length < 2) return 'Insufficient data';

    const firstHalf = weekEntries.slice(0, Math.ceil(weekEntries.length / 2));
    const secondHalf = weekEntries.slice(Math.ceil(weekEntries.length / 2));

    let firstAvg = 0,
      secondAvg = 0,
      firstCount = 0,
      secondCount = 0;

    firstHalf.forEach((e) => {
      if (e.nightReflection && e.nightReflection[key as keyof typeof e.nightReflection] !== undefined) {
        firstAvg += e.nightReflection[key as keyof typeof e.nightReflection] as number;
        firstCount++;
      }
    });

    secondHalf.forEach((e) => {
      if (e.nightReflection && e.nightReflection[key as keyof typeof e.nightReflection] !== undefined) {
        secondAvg += e.nightReflection[key as keyof typeof e.nightReflection] as number;
        secondCount++;
      }
    });

    firstAvg = firstCount > 0 ? firstAvg / firstCount : 0;
    secondAvg = secondCount > 0 ? secondAvg / secondCount : 0;

    if (secondAvg > firstAvg + 5) return '📈 Improving';
    if (secondAvg < firstAvg - 5) return '📉 Declining';
    return '➡️ Stable';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E8E4F3] soft-shadow">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-[#E8E4F3]/30 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Weekly Reflection</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekNumber(weekNumber + 1)}
            className="px-4 py-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all"
          >
            ← Previous
          </button>
          <div className="text-center">
            <h2 className="font-bold text-foreground">{getWeekLabel()}</h2>
            <p className="text-sm text-muted-foreground">{weekEntries.length} days tracked</p>
          </div>
          <button
            onClick={() => setWeekNumber(Math.max(0, weekNumber - 1))}
            disabled={weekNumber === 0}
            className="px-4 py-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all disabled:opacity-50"
          >
            Next →
          </button>
        </div>

        {weekEntries.length === 0 ? (
          <div className="bg-white/50 rounded-2xl p-12 text-center space-y-4">
            <p className="text-2xl">📋</p>
            <h2 className="text-lg font-bold text-foreground">No data for this week</h2>
            <p className="text-muted-foreground">Start tracking to see your weekly reflection</p>
          </div>
        ) : (
          <>
            {/* Weekly Metrics */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Weekly Averages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'energy', label: 'Energy', emoji: '✨' },
                  { key: 'focus', label: 'Focus', emoji: '🎯' },
                  { key: 'stress', label: 'Stress', emoji: '🌊' },
                  { key: 'motivation', label: 'Motivation', emoji: '🌿' },
                  { key: 'sleepQuality', label: 'Sleep Quality', emoji: '🌙' },
                  { key: 'mentalClarity', label: 'Mental Clarity', emoji: '💎' },
                ].map((metric) => (
                  <div key={metric.key} className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{metric.emoji}</span>
                        <span className="font-semibold text-foreground">{metric.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {calculateWeeklyAverage(metric.key)}
                        </div>
                        <div className="text-xs text-muted-foreground">{getWeeklyTrend(metric.key)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reflection Prompts */}
            <div className="bg-white/60 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-foreground">✨ Reflection Prompts</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-[#D4E8F7] pl-4">
                  <p className="font-semibold text-foreground text-sm">What went well this week?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider your highest metrics and celebrate those wins.
                  </p>
                </div>
                <div className="border-l-4 border-[#FFE5CC] pl-4">
                  <p className="font-semibold text-foreground text-sm">What challenged you?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Look at your lower metrics and identify patterns.
                  </p>
                </div>
                <div className="border-l-4 border-[#D9E8D9] pl-4">
                  <p className="font-semibold text-foreground text-sm">What will you focus on next week?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set one intention based on this week's insights.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
