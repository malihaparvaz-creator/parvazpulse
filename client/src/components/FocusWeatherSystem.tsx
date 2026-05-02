/**
 * Parvaz Pulse - Focus Weather System Component
 * Visualizes mental state as weather conditions
 * 
 * Design Philosophy: Ethereal Minimalism
 * - Beautiful gradient backgrounds
 * - Smooth animations
 * - Non-toxic, calming visual feedback
 */

import React, { useEffect, useState } from 'react';
import { MentalState, getFocusWeather } from '@/lib/store';

type WeatherType = 'calm' | 'focused' | 'overwhelmed' | 'balanced';

interface FocusWeatherSystemProps {
  mentalState: Partial<MentalState>;
  compact?: boolean;
  greeting?: { text: string; emoji: string };
  canEnter?: boolean;
}

const weatherConfig: Record<WeatherType, { title: string; description: string; gradient: string; bgImage: string }> = {
  calm: {
    title: 'Calm',
    description: 'Your mind is peaceful and clear',
    gradient: 'from-[#E8E4F3] via-[#D4E8F7] to-[#D9E8D9]',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663608348410/dgmaB5D4cV9NkuKQ5UDBHU/focus-weather-calm-Cq4oLjDgKMaW5WWcKq3gz7.webp',
  },
  focused: {
    title: 'Deep Focus',
    description: 'You are locked in and sharp',
    gradient: 'from-[#C5D9F1] via-[#D4E8F7] to-[#B8D4E8]',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663608348410/dgmaB5D4cV9NkuKQ5UDBHU/focus-weather-focused-4ud5jaKcAEMRyEWqpLPcLE.webp',
  },
  overwhelmed: {
    title: 'Overwhelmed',
    description: 'Take a moment to breathe',
    gradient: 'from-[#E8E8E8] via-[#E8E4F3] to-[#D9E8F0]',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663608348410/dgmaB5D4cV9NkuKQ5UDBHU/focus-weather-overwhelmed-3333LAS6vKoxjdEx3PXHD4.webp',
  },
  balanced: {
    title: 'Balanced',
    description: 'You are in a good place',
    gradient: 'from-[#F5F1E8] via-[#E8E4F3] to-[#D4E8F7]',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663608348410/dgmaB5D4cV9NkuKQ5UDBHU/calm-gradient-bg-Cq4oLjDgKMaW5WWcKq3gz7.webp',
  },
};

export function FocusWeatherSystem({ mentalState, compact = false, greeting, canEnter = true }: FocusWeatherSystemProps) {
  const [weather, setWeather] = useState<WeatherType>('balanced');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const newWeather = getFocusWeather(mentalState);
    if (newWeather !== weather) {
      setIsAnimating(true);
      setTimeout(() => {
        setWeather(newWeather);
        setIsAnimating(false);
      }, 150);
    }
  }, [mentalState, weather]);

  const config = weatherConfig[weather];

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-6 py-4">
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8E4F3] to-[#D4E8F7] ethereal-glow soft-shadow transition-all duration-300"
          style={{
            backgroundImage: `url(${config.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isAnimating ? 0.5 : 1,
          }}
        />
        <div>
          <h3 className="font-semibold text-foreground">{greeting ? greeting.text : config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden transition-all duration-500 soft-shadow"
      style={{
        backgroundImage: `url(${config.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '280px',
        opacity: isAnimating ? 0.75 : 1,
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-40`} />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-2">{greeting ? greeting.text : config.title}</h2>
        <p className="text-lg text-foreground/80 max-w-xs">{config.description}</p>
        {!canEnter && (
          <p className="text-sm text-red-600 font-medium mt-3">📝 Entries available after 5 PM</p>
        )}

        {/* Mental state indicators */}
        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          {mentalState.focus !== undefined && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-xs text-foreground/70">Focus</p>
              <p className="text-lg font-semibold text-foreground">{mentalState.focus}%</p>
            </div>
          )}
          {mentalState.stress !== undefined && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-xs text-foreground/70">Stress</p>
              <p className="text-lg font-semibold text-foreground">{mentalState.stress}%</p>
            </div>
          )}
          {mentalState.energy !== undefined && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-xs text-foreground/70">Energy</p>
              <p className="text-lg font-semibold text-foreground">{mentalState.energy}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
