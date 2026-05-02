import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { getAllEntries, DayEntry, MentalState } from '@/lib/store';

export default function Analytics() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [averageState, setAverageState] = useState<Partial<MentalState>>({});

  useEffect(() => {
    const allEntries = getAllEntries();
    setEntries(allEntries);

    // Calculate average state from all night reflections
    if (allEntries.length > 0) {
      const avg: Partial<MentalState> = {};
      const keys = Object.keys(allEntries[0].nightReflection || {});

      keys.forEach((key) => {
        let sum = 0;
        let count = 0;
        allEntries.forEach((entry) => {
          if (entry.nightReflection && entry.nightReflection[key as keyof MentalState] !== undefined) {
            sum += entry.nightReflection[key as keyof MentalState] as number;
            count++;
          }
        });
        if (count > 0) {
          avg[key as keyof MentalState] = Math.round(sum / count);
        }
      });

      setAverageState(avg);
    }
  }, []);

  const metrics = [
    { key: 'energy' as const, label: 'Energy', emoji: '✨', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
    { key: 'focus' as const, label: 'Focus', emoji: '🎯', color: 'from-[#D4E8F7] to-[#C5D9F1]' },
    { key: 'stress' as const, label: 'Stress', emoji: '🌊', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
    { key: 'motivation' as const, label: 'Motivation', emoji: '🌿', color: 'from-[#D9E8D9] to-[#C5D9C5]' },
    { key: 'sleepQuality' as const, label: 'Sleep Quality', emoji: '🌙', color: 'from-[#E8E4F3] to-[#D4D4FF]' },
    { key: 'discipline' as const, label: 'Discipline', emoji: '🔮', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
    { key: 'mentalClarity' as const, label: 'Mental Clarity', emoji: '💎', color: 'from-[#D4E8F7] to-[#C5D9F1]' },
    { key: 'overwhelm' as const, label: 'Overwhelm', emoji: '🌀', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
    { key: 'socialBattery' as const, label: 'Social Battery', emoji: '🌸', color: 'from-[#D9E8D9] to-[#C5D9C5]' },
    { key: 'emotionalState' as const, label: 'Emotional State', emoji: '💫', color: 'from-[#E8E4F3] to-[#D4D4FF]' },
  ];

  const getHealthScore = (): number => {
    if (Object.keys(averageState).length === 0) return 0;
    const values = Object.values(averageState).filter((v) => typeof v === 'number') as number[];
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const getHealthStatus = (score: number): string => {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    return 'Needs Attention';
  };

  const getHealthColor = (score: number): string => {
    if (score >= 75) return 'from-[#D9E8D9] to-[#C5D9C5]';
    if (score >= 60) return 'from-[#D4E8F7] to-[#C5D9F1]';
    if (score >= 45) return 'from-[#E8E4F3] to-[#D4D4FF]';
    return 'from-[#FFE5CC] to-[#FFD4B3]';
  };

  const healthScore = getHealthScore();

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
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {entries.length === 0 ? (
          <div className="bg-white/50 rounded-2xl p-12 text-center space-y-4">
            <p className="text-2xl">📉</p>
            <h2 className="text-lg font-bold text-foreground">No data yet</h2>
            <p className="text-muted-foreground">Start tracking to see your analytics</p>
          </div>
        ) : (
          <>
            {/* Overall Health Score */}
            <div className={`bg-gradient-to-r ${getHealthColor(healthScore)} rounded-2xl p-8 text-center space-y-3`}>
              <h2 className="text-lg font-bold text-foreground">Overall Wellbeing Score</h2>
              <div className="text-5xl font-bold text-foreground">{healthScore}</div>
              <p className="text-foreground font-semibold">{getHealthStatus(healthScore)}</p>
              <p className="text-sm text-muted-foreground">Based on {entries.length} night reflection(s)</p>
            </div>

            {/* Metric Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Your Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.map((metric) => {
                  const value = averageState[metric.key] ?? 0;
                  return (
                    <div key={metric.key} className={`bg-gradient-to-r ${metric.color} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{metric.emoji}</span>
                          <div>
                            <div className="font-semibold text-foreground">{metric.label}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">{value}</div>
                          <div className="text-xs text-muted-foreground">/100</div>
                        </div>
                      </div>
                      <div className="relative h-2 bg-white/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#A8D5F7] to-[#8BC5F0] transition-all"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white/60 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-foreground">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{entries.length}</div>
                  <div className="text-xs text-muted-foreground">Night Reflections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round((entries.filter((e) => e.nightReflection && Object.keys(e.nightReflection).length > 0).length / entries.length) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
