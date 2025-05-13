import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Range } from '@renderer/types/utils';

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
  range: Range;
  isHalf: boolean;
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
  range,
  isHalf,
}) => {
  const { isRounded, margin, ledHeight, ledWidth } = style;
  const [displayValue, setDisplayValue] = useState(value);

  // Синхронизируем displayValue с внешним value
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleClick = () => {
    if (!isClickable) return;

    let newValue = currentBrushValue;

    if (!isHalf && value !== range.max) {
      newValue = range.max;
    }
    if (!isHalf && value === range.max) {
      newValue = range.min;
    }
    setDisplayValue(newValue);
    onChange(rowIndex, colIndex, newValue);
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
      title={`Значение: ${displayValue}`}
    >
      <div
        style={{
          opacity: 1 - (displayValue - range.min) / (range.max - range.min),
        }}
        className="h-full w-full bg-[#343a40]"
      ></div>
    </button>
  );
};
