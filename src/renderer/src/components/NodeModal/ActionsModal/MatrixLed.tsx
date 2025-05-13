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

  const handleClick = () => {
    if (!isClickable) return;

    if (isHalf) return onChange(rowIndex, colIndex, currentBrushValue);

    if (value !== range.max) {
      return onChange(rowIndex, colIndex, range.max);
    }

    return onChange(rowIndex, colIndex, range.min);
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
      title={`Значение: ${value}`}
    >
      <div
        style={{
          opacity: 1 - (value - range.min) / (range.max - range.min),
        }}
        className="h-full w-full bg-[#343a40]"
      ></div>
    </button>
  );
};
