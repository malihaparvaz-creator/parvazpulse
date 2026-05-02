import React, { useRef, useState } from 'react';
import { ArrowLeft, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMusic } from '@/contexts/MusicContext';
import { toast } from 'sonner';
import { getAllEntries, DayEntry, syncAllToFirestore } from '@/lib/store';

export default function Settings() {
  const [, navigate] = useLocation();
  const {
    volume,
    currentTrack,
    customTracks,
    selectedCustomTrack,
    disabledTracks,
    setVolume,
    setCurrentTrack,
    setSelectedCustomTrack,
    togglePlayback,
    addCustomTrack,
    removeCustomTrack,
    deletePresetTrack,
  } = useMusic();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries] = useState<DayEntry[]>(() => {
    const entries = getAllEntries();
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  const getStateLabel = (value: number): string => {
    if (value < 20) return 'Very Low';
    if (value < 40) return 'Low';
    if (value < 60) return 'Moderate';
    if (value < 80) return 'High';
    return 'Very High';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Please select an audio file'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('File size must be less than 50MB'); return; }
    setIsLoading(true);
    try {
      await addCustomTrack(file);
      toast.success(`Added "${file.name}"`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch { toast.error('Failed to add music'); }
    finally { setIsLoading(false); }
  };

  const handleClearData = () => {
    if (confirm('Are you sure? This will delete all your data and cannot be undone.')) {
      localStorage.clear();
      toast.success('All data cleared');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const PRESET_TRACKS = [
    { id: 'ambient', label: '🌊 Ambient', desc: 'Soft, ethereal soundscape' },
    { id: 'nature', label: '🌿 Nature', desc: 'Forest and water sounds' },
    { id: 'piano', label: '🎹 Piano', desc: 'Gentle piano melodies' },
    { id: 'islamic1', label: '🕌 Islamic Calm I', desc: 'Peaceful nasheed atmosphere' },
    { id: 'islamic2', label: '☪️ Islamic Calm II', desc: 'Tranquil Quran-inspired soundscape' },
    { id: 'none', label: '🔇 Off', desc: 'No background music' },
  ];

  const MENTAL_STATE_LABELS: Record<string, string> = {
    energy: 'Energy ✨',
    focus: 'Focus 🎯',
    stress: 'Stress 🌊',
    motivation: 'Motivation 🌿',
    sleepQuality: 'Sleep Quality 🌙',
    discipline: 'Discipline 🔮',
    mentalClarity: 'Mental Clarity 💎',
    overwhelm: 'Overwhelm 🌀',
    socialBattery: 'Social Battery 🌸',
    emotionalState: 'Emotional State 💫',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E8E4F3] soft-shadow">
        <div className="flex items-center gap-4 px-6 py-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-[#E8E4F3]/30 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8">

        {/* View History */}
        <section className="space-y-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/60 hover:bg-white/80 transition-all border-2 border-transparent hover:border-[#E8E4F3]"
          >
            <div className="text-left">
              <div className="font-semibold text-foreground flex items-center gap-2"><span>📚</span> View History</div>
              <div className="text-sm text-muted-foreground">{historyEntries.length} daily {historyEntries.length === 1 ? 'entry' : 'entries'} recorded</div>
            </div>
            {showHistory ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showHistory && (
            <div className="space-y-4">
              {historyEntries.length === 0 ? (
                <div className="p-6 bg-white/60 rounded-xl border border-[#E8E4F3] text-center">
                  <p className="text-muted-foreground">No entries yet. Start logging your reflections after 5 PM!</p>
                </div>
              ) : (
                historyEntries.map((entry) => {
                  const reflection = entry.nightReflection || {};
                  const hasData = Object.keys(reflection).length > 0;
                  const enteredAt = entry.enteredAt ? new Date(entry.enteredAt) : null;
                  return (
                    <div key={entry.date} className="p-5 bg-white/70 rounded-xl border border-[#E8E4F3] space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-base">{formatDate(entry.date)}</h3>
                        {enteredAt && (
                          <span className="text-xs text-muted-foreground bg-[#E8E4F3]/60 px-2 py-1 rounded-full">
                            Logged {enteredAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {hasData ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(MENTAL_STATE_LABELS).map(([key, label]) => {
                            const val = (reflection as any)[key];
                            if (val === undefined || val === null) return null;
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">{label}</span>
                                  <span className="text-xs font-semibold text-foreground">{val}% · {getStateLabel(val)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#E8E4F3] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[#C8B4DC] to-[#A8D5F7]" style={{ width: `${val}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No reflection data recorded for this day.</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Background Music */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span style={{ filter: 'hue-rotate(-5deg) saturate(0.9)' }}>🎵</span> Background Music
          </h2>
          <p className="text-sm text-muted-foreground">5 preset tracks — all loop until you stop them</p>

          <div className="space-y-2">
            {PRESET_TRACKS
              .filter((track) => !disabledTracks.has(track.id))
              .map((track) => (
                <div
                  key={track.id}
                  className={`p-4 rounded-xl transition-all flex items-center justify-between ${
                    currentTrack === track.id
                      ? 'bg-[#D4E8F7] border-2 border-[#A8D5F7] soft-shadow'
                      : 'bg-white/60 border-2 border-transparent hover:bg-white/80'
                  }`}
                >
                  <button onClick={() => setCurrentTrack(track.id as any)} className="flex-1 text-left">
                    <div className="font-semibold text-foreground">{track.label}</div>
                    <div className="text-sm text-muted-foreground">{track.desc}</div>
                  </button>
                  {track.id !== 'none' && (
                    <button
                      onClick={() => { deletePresetTrack(track.id); toast.success(`${track.label} removed`); }}
                      className="p-2 hover:bg-red-100/50 rounded-full transition-colors ml-2"
                      title="Remove track"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
          </div>

          {customTracks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Your Music</p>
              <div className="space-y-2">
                {customTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`p-4 rounded-xl transition-all flex items-center justify-between ${
                      selectedCustomTrack === track.id
                        ? 'bg-[#D4E8F7] border-2 border-[#A8D5F7] soft-shadow'
                        : 'bg-white/60 border-2 border-transparent hover:bg-white/80'
                    }`}
                  >
                    <button onClick={() => setSelectedCustomTrack(track.id)} className="flex-1 text-left">
                      <div className="font-semibold text-foreground truncate">{track.name}</div>
                      <div className="text-xs text-muted-foreground">Custom upload</div>
                    </button>
                    <button onClick={() => { removeCustomTrack(track.id); toast.success('Music removed'); }} className="p-2 hover:bg-red-100/50 rounded-full transition-colors ml-2">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[#E8E4F3] to-[#D4E8F7] hover:from-[#D4E8F7] hover:to-[#C5D9F1] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">{isLoading ? 'Adding...' : 'Add Your Music'}</span>
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
            <p className="text-xs text-muted-foreground mt-2">MP3, WAV, OGG up to 50MB</p>
          </div>
        </section>

        {/* Volume */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><span>🔊</span> Volume</h2>
          <div className="space-y-4">
            <input
              type="range" min="0" max="100" value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-[#E8E4F3] to-[#D4E8F7] rounded-full appearance-none cursor-pointer accent-[#A8D5F7]"
            />
            <div className="text-center text-sm text-muted-foreground">{volume}%</div>
            <button
              onClick={togglePlayback}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-[#D4E8F7] to-[#C5D9F1] hover:from-[#C5D9F1] hover:to-[#B6CAFE] transition-all font-medium text-foreground soft-shadow"
            >
              ▶ Play / Pause Music
            </button>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4 pb-8">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><span>🗑️</span> Data Management</h2>
          <p className="text-sm text-muted-foreground">Reset specific sections without affecting others.</p>

          <div className="space-y-3">

            {/* Reset Weekly */}
            <button onClick={() => {
              if (!confirm('Reset all weekly data?')) return;
              const keys = Object.keys(localStorage).filter(k => k.includes('weekly') || k.includes('week'));
              keys.forEach(k => localStorage.removeItem(k));
              // Also clear weeklyStudyLog from entries
              const raw = localStorage.getItem('parvaz-entries');
              if (raw) {
                try {
                  const entries = JSON.parse(raw);
                  const cleaned = entries.map((e: any) => ({ ...e, weeklyData: undefined }));
                  localStorage.setItem('parvaz-entries', JSON.stringify(cleaned));
                } catch {}
              }
              syncAllToFirestore();
              toast.success('Weekly data reset');
            }} className="w-full p-4 rounded-xl bg-white/60 hover:bg-orange-50 transition-all text-left border-2 border-[#E8E4F3] hover:border-orange-200">
              <div className="font-semibold text-foreground">📅 Reset Weekly Data</div>
              <div className="text-sm text-muted-foreground">Clears weekly summaries and logs</div>
            </button>

            {/* Reset Analytics */}
            <button onClick={() => {
              if (!confirm('Reset all analytics data?')) return;
              localStorage.removeItem('parvaz-analytics');
              localStorage.removeItem('parvaz-patterns');
              // Clear mentalState history from entries but keep dates
              const raw = localStorage.getItem('parvaz-entries');
              if (raw) {
                try {
                  const entries = JSON.parse(raw);
                  const cleaned = entries.map((e: any) => ({ ...e, mentalState: undefined, wellbeingScore: undefined }));
                  localStorage.setItem('parvaz-entries', JSON.stringify(cleaned));
                } catch {}
              }
              syncAllToFirestore();
              toast.success('Analytics reset');
            }} className="w-full p-4 rounded-xl bg-white/60 hover:bg-orange-50 transition-all text-left border-2 border-[#E8E4F3] hover:border-orange-200">
              <div className="font-semibold text-foreground">📊 Reset Analytics</div>
              <div className="text-sm text-muted-foreground">Clears mental state analytics and patterns</div>
            </button>

            {/* Reset Mood Canvas */}
            <button onClick={() => {
              if (!confirm('Delete all mood canvases?')) return;
              localStorage.removeItem('parvaz-mood-canvas');
              syncAllToFirestore();
              toast.success('All mood canvases deleted');
            }} className="w-full p-4 rounded-xl bg-white/60 hover:bg-orange-50 transition-all text-left border-2 border-[#E8E4F3] hover:border-orange-200">
              <div className="font-semibold text-foreground">🎨 Reset Mood Canvas</div>
              <div className="text-sm text-muted-foreground">Deletes all saved mood canvases</div>
            </button>

            {/* Reset Experiments */}
            <button onClick={() => {
              if (!confirm('Delete all experiments?')) return;
              localStorage.removeItem('parvaz-experiments');
              syncAllToFirestore();
              toast.success('Experiments reset');
            }} className="w-full p-4 rounded-xl bg-white/60 hover:bg-orange-50 transition-all text-left border-2 border-[#E8E4F3] hover:border-orange-200">
              <div className="font-semibold text-foreground">🧪 Reset Experiments</div>
              <div className="text-sm text-muted-foreground">Clears all experiment entries</div>
            </button>

            {/* Reset Daily History */}
            <button onClick={() => {
              if (!confirm('Delete all daily history entries?')) return;
              localStorage.removeItem('parvaz-entries');
              syncAllToFirestore();
              toast.success('Daily history cleared');
              setTimeout(() => window.location.reload(), 500);
            }} className="w-full p-4 rounded-xl bg-white/60 hover:bg-orange-50 transition-all text-left border-2 border-[#E8E4F3] hover:border-orange-200">
              <div className="font-semibold text-foreground">📖 Reset Daily History</div>
              <div className="text-sm text-muted-foreground">Clears all daily reflection entries</div>
            </button>

            {/* Reset Settings */}
            <button onClick={() => {
              if (!confirm('Reset all settings to default?')) return;
              localStorage.removeItem('parvaz-settings');
              syncAllToFirestore();
              toast.success('Settings reset to default');
              setTimeout(() => window.location.reload(), 500);
            }} className="w-full p-4 rounded-xl bg-white/60 hover:bg-orange-50 transition-all text-left border-2 border-[#E8E4F3] hover:border-orange-200">
              <div className="font-semibold text-foreground">⚙️ Reset Settings</div>
              <div className="text-sm text-muted-foreground">Restores all settings to default values</div>
            </button>

            {/* Reset Everything */}
            <div className="pt-2 border-t border-[#E8E4F3]">
              <button onClick={handleClearData}
                className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-all text-left border-2 border-red-200">
                <div className="font-semibold text-red-700">🗑️ Reset Everything</div>
                <div className="text-sm text-red-600">Delete all data and reset the entire app</div>
              </button>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
