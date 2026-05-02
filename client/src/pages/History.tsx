import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { getAllEntries, DayEntry } from '@/lib/store';

export default function History() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<DayEntry[]>([]);

  useEffect(() => {
    const allEntries = getAllEntries();
    const sorted = [...allEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(sorted);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      Overwhelmed: '🌊',
      Struggling: '😔',
      Neutral: '😐',
      Good: '😊',
      Happy: '😄',
      Joyful: '🎉',
      Balanced: '⚖️',
    };
    return emojis[mood] || '✨';
  };

  const getAverageMood = (entry: DayEntry) => {
    const reflection = entry.nightReflection;
    if (!reflection || Object.keys(reflection).length === 0) return 'Balanced';

    const focus = reflection.focus ?? 50;
    const stress = reflection.stress ?? 50;
    const overwhelm = reflection.overwhelm ?? 50;
    const clarity = reflection.mentalClarity ?? 50;
    const emotional = reflection.emotionalState ?? 50;

    if (overwhelm > 70) return 'Overwhelmed';
    if (focus > 75 && stress < 40) return 'Focused';
    if (stress < 30 && clarity > 70) return 'Calm';
    if (emotional > 70) return 'Happy';
    if (emotional < 30) return 'Struggling';
    return 'Balanced';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E8E4F3] soft-shadow">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-[#E8E4F3]/30 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">History</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {entries.length === 0 ? (
          <div className="bg-white/50 rounded-2xl p-12 text-center space-y-4">
            <p className="text-2xl">📖</p>
            <h2 className="text-xl font-bold text-foreground">No entries yet</h2>
            <p className="text-muted-foreground">Start tracking your mental state to see your history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const mood = getAverageMood(entry);
              const moodEmoji = getMoodEmoji(mood);
              const reflection = entry.nightReflection;

              return (
                <div
                  key={entry.date}
                  className="bg-white/60 hover:bg-white/80 rounded-2xl p-6 transition-all soft-shadow cursor-pointer border-2 border-transparent hover:border-[#E8E4F3]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{formatDate(entry.date)}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {entry.notes && <p className="truncate">{entry.notes}</p>}
                        {!entry.notes && <p>Night reflection recorded</p>}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl mb-1">{moodEmoji}</div>
                      <div className="text-sm font-medium text-foreground">{mood}</div>
                    </div>
                  </div>

                  {/* Quick stats */}
                  {reflection && Object.keys(reflection).length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                      <div className="bg-gradient-to-br from-[#FFE5CC] to-[#FFD4B3] rounded-lg p-2 text-center">
                        <div className="font-semibold text-[#8B6B45]">Energy</div>
                        <div className="text-[#6B5535]">{Math.round((reflection.energy ?? 50) / 20)}/5</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#D4E8F7] to-[#C5D9F1] rounded-lg p-2 text-center">
                        <div className="font-semibold text-[#455B8B]">Focus</div>
                        <div className="text-[#354B6B]">{Math.round((reflection.focus ?? 50) / 20)}/5</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#D9E8D9] to-[#C5D9C5] rounded-lg p-2 text-center">
                        <div className="font-semibold text-[#45654B]">Motivation</div>
                        <div className="text-[#35453B]">{Math.round((reflection.motivation ?? 50) / 20)}/5</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#E8E4F3] to-[#D4D4FF] rounded-lg p-2 text-center">
                        <div className="font-semibold text-[#45458B]">Sleep</div>
                        <div className="text-[#35356B]">{Math.round((reflection.sleepQuality ?? 50) / 20)}/5</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#FFE5E5] to-[#FFD4D4] rounded-lg p-2 text-center">
                        <div className="font-semibold text-[#8B4545]">Stress</div>
                        <div className="text-[#6B3535]">{Math.round((reflection.stress ?? 50) / 20)}/5</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
