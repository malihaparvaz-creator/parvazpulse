import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { getTodayEntry, DayEntry, MentalState } from '@/lib/store';

export default function DayMap() {
  const [, navigate] = useLocation();
  const [entry, setEntry] = useState<DayEntry>(getTodayEntry());

  useEffect(() => {
    setEntry(getTodayEntry());
  }, []);

  const reflection = entry.nightReflection || {};

  const getEnergyLevel = (state: Partial<MentalState> | undefined): number => {
    return state?.energy ?? 50;
  };

  const getStateLabel = (value: number): string => {
    if (value < 20) return 'Very Low';
    if (value < 40) return 'Low';
    if (value < 60) return 'Balanced';
    if (value < 80) return 'High';
    return 'Very High';
  };

  const getOverallState = (reflection: Partial<MentalState>): string => {
    const values = Object.values(reflection).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return 'Balanced';
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    return getStateLabel(average);
  };

  const getSummaryMessage = (reflection: Partial<MentalState>): string => {
    const energy = reflection.energy ?? 50;
    const energyState = getStateLabel(energy);
    const focus = reflection.focus ?? 50;
    const stress = reflection.stress ?? 50;
    const motivation = reflection.motivation ?? 50;

    if (energyState === 'Very High') {
      return `You're bursting with energy tonight! This is the perfect time to tackle important tasks or pursue activities you're passionate about. Make the most of this peak energy!`;
    } else if (energyState === 'High') {
      if (stress > 70) return `You have great energy but you're feeling stressed. Channel this energy into calming activities like exercise or meditation to balance your state.`;
      if (motivation > 70) return `You're energized and motivated! This is an excellent time to work on your goals or engage in meaningful activities.`;
      return `You're feeling energetic and positive tonight. Great energy for both productivity and enjoyment!`;
    } else if (energyState === 'Balanced') {
      if (focus > 70 && stress < 40) return `You have steady energy with good focus and calm. Perfect conditions for productive work or creative pursuits.`;
      if (stress > 70) return `Your energy is moderate but stress is high. Consider relaxing activities to bring more balance to your night.`;
      return `You're in a balanced energy state. You have enough energy for your evening activities while maintaining a sense of calm.`;
    } else if (energyState === 'Low') {
      if (stress > 70) return `Your energy is low and stress is high. This is a sign to slow down, practice self-care, and let yourself rest.`;
      if (focus > 70) return `You're low on energy but still focused. Don't push too hard—prioritize rest and recovery tonight.`;
      return `Your energy is running low. Listen to your body and give yourself permission to rest and recharge.`;
    } else {
      return `Your energy is very low tonight. This is your body telling you it needs rest. Prioritize sleep and gentle self-care activities.`;
    }
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
          <h1 className="text-2xl font-bold text-foreground">Night Map</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <p className="text-center text-muted-foreground">Your mental state tonight</p>

        {Object.keys(reflection).length === 0 ? (
          <div className="bg-white/50 rounded-2xl p-12 text-center space-y-4">
            <p className="text-2xl">🌙</p>
            <h2 className="text-lg font-bold text-foreground">No reflection yet</h2>
            <p className="text-muted-foreground">Go to the home page to record your night reflection</p>
          </div>
        ) : (
          <>
            {/* Main Energy Display */}
            <div className="bg-gradient-to-r from-[#FFE5CC] to-[#FFD4B3] rounded-2xl p-8 text-center space-y-3 soft-shadow">
              <div className="text-5xl font-bold text-foreground">{getEnergyLevel(reflection)}</div>
              <div className="text-lg text-muted-foreground">Energy Level</div>
              <div className="text-sm font-medium text-foreground">{getStateLabel(getEnergyLevel(reflection))}</div>
            </div>

            {/* Mental State Grid */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Mental State Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'focus', label: 'Focus', emoji: '🎯', color: 'from-[#D4E8F7] to-[#C5D9F1]' },
                  { key: 'stress', label: 'Stress', emoji: '🌊', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
                  { key: 'motivation', label: 'Motivation', emoji: '🌿', color: 'from-[#D9E8D9] to-[#C5D9C5]' },
                  { key: 'mentalClarity', label: 'Mental Clarity', emoji: '💎', color: 'from-[#E8E4F3] to-[#D4D4FF]' },
                  { key: 'sleepQuality', label: 'Sleep Quality', emoji: '🌙', color: 'from-[#E8E4F3] to-[#D4D4FF]' },
                  { key: 'discipline', label: 'Discipline', emoji: '🔮', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
                  { key: 'overwhelm', label: 'Overwhelm', emoji: '🌀', color: 'from-[#FFE5CC] to-[#FFD4B3]' },
                  { key: 'socialBattery', label: 'Social Battery', emoji: '🌸', color: 'from-[#D9E8D9] to-[#C5D9C5]' },
                ].map((metric) => {
                  const value = reflection[metric.key as keyof MentalState] ?? 50;
                  return (
                    <div key={metric.key} className={`bg-gradient-to-r ${metric.color} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{metric.emoji}</span>
                          <span className="font-semibold text-foreground">{metric.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{value}</div>
                      </div>
                      <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 rounded-full" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/60 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-foreground">🌙 Tonight's Summary ({getStateLabel(reflection.energy ?? 50)})</h3>
              <p className="text-sm text-muted-foreground">
                {getSummaryMessage(reflection)}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
