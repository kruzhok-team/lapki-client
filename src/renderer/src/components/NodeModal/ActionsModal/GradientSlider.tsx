import { useRef, useState, useEffect } from 'react';

import './gradient.css';
import { Range } from '@renderer/types/utils';

interface GradientSliderProps {
  value: number;
  onChange: (value: number) => void;
  range: Range;
  step: number;
}

export const GradientSlider: React.FC<GradientSliderProps> = ({ value, onChange, range, step }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Нормализация значения в процентное соотношение для позиции ползунка
  const valueToPercent = (val: number) => {
    return ((val - range.min) / (range.max - range.min)) * 100;
  };

  // Перевод позиции в пикселях в значение с учетом шага
  const calculateValue = (clientX: number) => {
    if (!sliderRef.current) return value;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickPosition = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = clickPosition / rect.width;

    // Расчет значения с учетом диапазона и шага
    let rawValue = range.min + percent * (range.max - range.min);
    rawValue = Math.max(range.min, Math.min(range.max, rawValue));

    // Применение шага
    const steppedValue = Math.round(rawValue / step) * step;
    return steppedValue;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newValue = calculateValue(e.clientX);
    if (newValue !== value) onChange(newValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newValue = calculateValue(e.clientX);
      if (newValue !== value) onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange, value]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === thumbRef.current) return;
    const newValue = calculateValue(e.clientX);
    if (newValue !== value) onChange(newValue);
  };

  return (
    <div className="relative w-full">
      <div
        ref={sliderRef}
        className="relative h-6 w-full select-none rounded-full border border-border-primary bg-gradient-to-r from-matrix-inactive to-matrix-active"
        onClick={handleClick}
      >
        <div
          ref={thumbRef}
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform cursor-grab rounded-full border-2 border-gray-400 bg-white shadow-sm active:cursor-grabbing"
          style={{ left: `${valueToPercent(value)}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Дополнительные метки (опционально) */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{range.min}</span>
        <span>{range.max}</span>
      </div>
    </div>
  );
};
