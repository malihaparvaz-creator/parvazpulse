import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { getAllEntries, DayEntry, MentalState } from '@/lib/store';

export default function Patterns() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<DayEntry[]>([]);

  useEffect(() => {
    setEntries(getAllEntries());
  }, []);

  const calculateCorrelation = (values1: number[], values2: number[]): number => {
    if (values1.length < 2 || values1.length !== values2.length) return 0;

    const mean1 = values1.reduce((a, b) => a + b) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b) / values2.length;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const extractValues = (key: keyof MentalState): number[] => {
    return entries
      .map((entry) => entry.nightReflection?.[key])
      .filter((v) => v !== undefined) as number[];
  };

  const patterns = [
    { name1: 'Sleep Quality', key1: 'sleepQuality' as const, name2: 'Focus', key2: 'focus' as const },
    { name1: 'Stress', key1: 'stress' as const, name2: 'Energy', key2: 'energy' as const },
    { name1: 'Social Battery', key1: 'socialBattery' as const, name2: 'Motivation', key2: 'motivation' as const },
    { name1: 'Mental Clarity', key1: 'mentalClarity' as const, name2: 'Overwhelm', key2: 'overwhelm' as const },
  ];

  const correlations = patterns.map((p) => ({
    ...p,
    correlation: calculateCorrelation(extractValues(p.key1), extractValues(p.key2)),
  }));

  const getCorrelationColor = (corr: number): string => {
    if (corr > 0.5) return 'from-[#D9E8D9] to-[#C5D9C5]';
    if (corr > 0) return 'from-[#E8E4F3] to-[#D4D4FF]';
    if (corr > -0.5) return 'from-[#FFE5CC] to-[#FFD4B3]';
    return 'from-[#FFD4D4] to-[#FFC5C5]';
  };

  const getCorrelationLabel = (corr: number): string => {
    if (corr > 0.5) return 'Strong positive';
    if (corr > 0) return 'Weak positive';
    if (corr > -0.5) return 'Weak negative';
    return 'Strong negative';
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
          <h1 className="text-2xl font-bold text-foreground">Patterns</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Discover correlations in your mental states</h2>
          <p className="text-sm text-muted-foreground">How different aspects of your wellbeing relate to each other</p>
        </div>

        {entries.length < 2 ? (
          <div className="bg-white/50 rounded-2xl p-12 text-center space-y-4">
            <p className="text-2xl">📊</p>
            <h2 className="text-lg font-bold text-foreground">Need more data</h2>
            <p className="text-muted-foreground">Track at least 2 days to see patterns</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {correlations.map((pattern) => (
                <div
                  key={`${pattern.key1}-${pattern.key2}`}
                  className={`bg-gradient-to-r ${getCorrelationColor(pattern.correlation)} rounded-2xl p-6 soft-shadow`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {pattern.name1} ↔ {pattern.name2}
                      </h3>
                      <p className="text-sm text-muted-foreground">{getCorrelationLabel(pattern.correlation)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-foreground">
                        {(pattern.correlation * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Correlation bar */}
                  <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full transition-all"
                      style={{ width: `${Math.abs(pattern.correlation) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/60 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-foreground">💡 Understanding Correlations</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Positive correlation:</strong> When one increases, the other tends to increase</li>
                <li>• <strong>Negative correlation:</strong> When one increases, the other tends to decrease</li>
                <li>• <strong>Stronger correlations (closer to 100%):</strong> Are more reliable patterns</li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
