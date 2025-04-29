import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

export interface MatrixStyle {
  ledWidth: number;
  ledHeight: number;
  margin: number;
  border: number;
  isRounded: boolean;
}

interface MatrixLedProps {
  rowIndex: number;
  colIndex: number;
  value: number;
  isClickable: boolean;
  style: MatrixStyle;
  currentBrushValue: number;
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixLed: React.FC<MatrixLedProps> = ({
  isClickable,
  colIndex,
  rowIndex,
  value,
  onChange,
  style,
  currentBrushValue,
}) => {
  const { isRounded, margin, ledHeight, ledWidth } = style;
  const [displayValue, setDisplayValue] = useState(value);

  // Синхронизируем displayValue с внешним value
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleClick = () => {
    if (!isClickable) return;

    const newValue = currentBrushValue;
    setDisplayValue(newValue);
    onChange(rowIndex, colIndex, newValue);
  };

  // Динамически вычисляемый стиль фона
  const getBackground = () => {
    if (displayValue === 0) return 'bg-matrix-inactive';
    if (displayValue === 100) return 'bg-matrix-active';

    return `bg-matrix-inactive-${displayValue * 100}`;
  };

  return (
    <button
      style={{
        height: ledHeight * 4,
        margin: margin * 4,
        width: ledWidth * 4,
      }}
      className={twMerge(
        'border-2 border-border-primary bg-matrix-active',
        isRounded && 'rounded',
        isClickable && 'cursor-pointer',
        'transition-colors duration-200'
      )}
      type="button"
      onClick={handleClick}
      title={`Value: ${displayValue}`}
    >
      <div
        style={{
          opacity: 1 - displayValue / 100,
        }}
        className="h-full w-full bg-[#343a40]"
      ></div>
    </button>
  );
};
