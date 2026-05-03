import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  getBrainDumps,
  saveBrainDump,
  deleteBrainDump,
  clearAllBrainDumps,
  incrementSOSCount,
  getTodaySOSCount,
  resetTodayEntry,
  BrainDump,
} from '@/lib/store';

const BREATHING_MODES = {
  box: { name: 'Box Breathing', phases: [4, 4, 4, 4], labels: ['Breathe in', 'Hold', 'Breathe out', 'Hold'], desc: 'Focus and calm' },
  '4-7-8': { name: '4-7-8', phases: [4, 7, 8, 0], labels: ['Breathe in', 'Hold', 'Breathe out', ''], desc: 'Anxiety and sleep' },
  just: { name: 'Just Breathe', phases: [5, 0, 5, 0], labels: ['Breathe in', '', 'Breathe out', ''], desc: 'Quick reset' },
};

const SOS_ACTIONS = [
  "Close your eyes. Take 3 slow breaths. You are safe right now.",
  "Name 5 things you can see. You are here. You are present.",
  "Put your hand on your chest. Feel your heartbeat. It's steady. So are you.",
  "Drink some water. Stand up. Shake your hands loose. Reset.",
  "You don't have to solve everything right now. Just this moment. Just breathe.",
  "What is the ONE thing that actually matters right now? Everything else can wait.",
  "You have handled hard things before. This is one more. You already know how.",
  "Step outside or open a window. Fresh air. 60 seconds. That's all.",
];

export default function ResetMind() {
  const [, navigate] = useLocation();
  const [brainDumpText, setBrainDumpText] = useState('');
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [breathingMode, setBreathingMode] = useState<keyof typeof BREATHING_MODES>('box');
  const [isBreathing, setIsBreathing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sosIndex, setSosIndex] = useState(0);
  const [showSOS, setShowSOS] = useState(false);
  const [sosCount, setSosCount] = useState(0);

  useEffect(() => {
    setBrainDumps(getBrainDumps().slice(-3));
    setSosCount(getTodaySOSCount());
  }, []);

  const handleDump = () => {
    if (!brainDumpText.trim()) return;
    saveBrainDump(brainDumpText);
    setBrainDumpText('');
    setBrainDumps(getBrainDumps().slice(-3));
    toast.success('Released. Your mind is lighter now.');
  };

  const handleDeleteDump = (index: number) => {
    const allDumps = getBrainDumps();
    const realIndex = Math.max(0, allDumps.length - brainDumps.length + index);
    deleteBrainDump(realIndex);
    setBrainDumps(getBrainDumps().slice(-3));
  };

  const handleClearAll = () => {
    clearAllBrainDumps();
    setBrainDumps([]);
  };

  const handleResetMentalState = () => {
    resetTodayEntry();
    toast.success('Mental state reset. Start fresh.');
  };

  const startBreathing = () => {
    if (isBreathing) {
      setIsBreathing(false);
      setCurrentPhase(0);
      setCountdown(0);
      return;
    }
    setIsBreathing(true);
    setCurrentPhase(0);
    setCountdown(BREATHING_MODES[breathingMode].phases[0]);
  };

  useEffect(() => {
    if (!isBreathing) return;
    const mode = BREATHING_MODES[breathingMode];
    let phase = currentPhase;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev > 1) return prev - 1;
        let next = (phase + 1) % 4;
        // Skip phases with 0 duration
        while (mode.phases[next] === 0) next = (next + 1) % 4;
        phase = next;
        setCurrentPhase(next);
        return mode.phases[next];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreathing, breathingMode]);

  const handleSOS = () => {
    setShowSOS(true);
  };

  const handleSOSHelped = () => {
    incrementSOSCount();
    setSosCount(getTodaySOSCount());
    toast.success('Noted. Keep going.');
    setShowSOS(false);
    setSosIndex((sosIndex + 1) % SOS_ACTIONS.length);
  };

  const breathingScale = isBreathing
    ? [1.18, 1.22, 0.84, 0.88][currentPhase] ?? 1
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full hover:bg-white/60"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Reset Mind</h1>
        </div>

        {/* Brain Dump */}
        <Card className="bg-white/60 backdrop-blur-sm border border-[#E8E4F3] soft-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Brain Dump</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={brainDumpText}
              onChange={(e) => setBrainDumpText(e.target.value)}
              placeholder="Everything in your head — just pour it out. No one is reading this. No rules."
              className="min-h-[200px] resize-none"
            />
            <Button onClick={handleDump} className="rounded-xl">
              Dump it
            </Button>
            <div className="space-y-2">
              {brainDumps.map((dump, index) => (
                <div key={index} className="bg-[#F5F1E8]/60 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground flex-1">{dump.text}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDump(index)}
                      className="ml-2 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(dump.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClearAll} className="rounded-xl">
                Clear all dumps
              </Button>
              <Button variant="outline" onClick={handleResetMentalState} className="rounded-xl">
                Reset mental state
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guided Breathing */}
        <Card className="bg-white/60 backdrop-blur-sm border border-[#E8E4F3] soft-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Guided Breathing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {Object.entries(BREATHING_MODES).map(([key, mode]) => (
                <Button
                  key={key}
                  variant={breathingMode === key ? 'default' : 'outline'}
                  onClick={() => setBreathingMode(key as keyof typeof BREATHING_MODES)}
                  className="rounded-xl"
                >
                  {mode.name}
                </Button>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#E9E0FB]/70 shadow-[0_0_40px_rgba(197,167,255,0.25)]" />
                <div
                  className="relative w-32 h-32 rounded-full border-4 border-[#B49FE1] bg-white/70 shadow-inner shadow-[#C7B0F0]/20 flex items-center justify-center"
                  style={{
                    transform: `scale(${breathingScale})`,
                    transition: 'transform 1s ease-in-out',
                  }}
                >
                  <div className="text-center px-2">
                    <div className="text-lg font-medium text-slate-800">
                      {BREATHING_MODES[breathingMode].labels[currentPhase] || ''}
                    </div>
                    {countdown > 0 && <div className="text-2xl font-bold">{countdown}</div>}
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={startBreathing} className="rounded-xl">
              {isBreathing ? 'Stop' : 'Start'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {BREATHING_MODES[breathingMode].desc}
            </p>
          </CardContent>
        </Card>

        {/* SOS */}
        <Card className="bg-white/60 backdrop-blur-sm border border-[#E8E4F3] soft-shadow">
          <CardHeader>
            <CardTitle className="text-lg">SOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showSOS ? (
              <div className="flex justify-center">
                <Button onClick={handleSOS} className="rounded-xl px-8 py-4 text-lg">
                  I need this right now
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-lg leading-relaxed">{SOS_ACTIONS[sosIndex]}</p>
                <Button onClick={handleSOSHelped} className="rounded-xl">
                  This helped
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Used {sosCount} times today
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}