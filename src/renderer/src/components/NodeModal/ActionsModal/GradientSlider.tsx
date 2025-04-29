import { useRef, useState, useEffect } from 'react';
import './gradient.css';

interface GradientSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const GradientSlider: React.FC<GradientSliderProps> = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValue = (clientX: number) => {
    if (!sliderRef.current) return value;
    const rect = sliderRef.current.getBoundingClientRect();
    const clickPosition = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return Math.round((clickPosition / rect.width) * 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onChange(calculateValue(e.clientX));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      onChange(calculateValue(e.clientX));
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
  }, [isDragging]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === thumbRef.current) return;
    onChange(calculateValue(e.clientX));
  };

  return (
    <div
      ref={sliderRef}
      className="relative h-6 w-full select-none rounded-full border border-border-primary bg-gradient-to-r from-matrix-inactive to-matrix-active"
      onClick={handleClick}
    >
      <div
        ref={thumbRef}
        className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform cursor-grab rounded-full border-2 border-gray-400 bg-white shadow-sm active:cursor-grabbing"
        style={{ left: `${value}%` }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
