/**
 * Parvaz Pulse - Mental State Slider Component
 * Draggable slider for tracking mental states
 * 
 * Design Philosophy: Ethereal Minimalism
 * - Smooth, satisfying drag interactions
 * - Gradient fills that shift with value
 * - Soft glow effects
 * - Large, readable labels
 */

import React, { useRef, useState, useEffect } from 'react';
import { getStateDescription } from '@/lib/store';

interface MentalStateSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  emoji?: string;
  description?: string;
  color?: 'lavender' | 'blue' | 'sage' | 'peach' | 'coral';
  stateKey?: string;
  disabled?: boolean;
}

const colorGradients: Record<string, string> = {
  lavender: 'from-[#E8E4F3] to-[#D4E8F7]',
  blue: 'from-[#D4E8F7] to-[#C5D9F1]',
  sage: 'from-[#D9E8D9] to-[#C9DCC9]',
  peach: 'from-[#F9E8D9] to-[#F5D9E8]',
  coral: 'from-[#F5B8A8] to-[#F5D9E8]',
};

export function MentalStateSlider({
  label,
  value,
  onChange,
  emoji = '✨',
  description,
  color = 'lavender',
  disabled = false,
}: MentalStateSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateValueFromTouch(e);
  };

  const updateValue = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round(percentage);

    setDisplayValue(newValue);
    onChange(newValue);
  };

  const updateValueFromTouch = (e: React.TouchEvent | TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : (e as any).touch;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round(percentage);

    setDisplayValue(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updateValue(e as any);
    const handleTouchMove = (e: TouchEvent) => updateValueFromTouch(e as any);
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const gradientClass = colorGradients[color] || colorGradients.lavender;
  const stateDesc = description || getStateDescription(displayValue);

  return (
    <div className="w-full space-y-3 px-4 py-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{label}</h3>
              <p className="text-xs text-muted-foreground truncate">{stateDesc}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold bg-gradient-to-r from-[#E8E4F3] to-[#D4E8F7] bg-clip-text text-transparent">
              {displayValue}
            </p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={disabled ? undefined : handleTouchStart}
        className={`relative h-10 w-full rounded-full bg-gradient-to-r ${gradientClass} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} overflow-hidden transition-all duration-200 ${
          isDragging ? 'ring-4 ring-[#D4E8F7] ring-opacity-50 scale-105' : 'hover:scale-102'
        } ethereal-glow soft-shadow`}
      >
        {/* Filled portion */}
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradientClass} opacity-100 transition-all duration-100`}
          style={{ width: `${displayValue}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-100 flex items-center justify-center"
          style={{ left: `${displayValue}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E8E4F3] to-[#D4E8F7]" />
        </div>
      </div>

      {/* Value indicator */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}
