import React from 'react';

import { twMerge } from 'tailwind-merge';

import { Range } from '@renderer/types/utils';
import { normalizeRangeValue } from '@renderer/utils';

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
  isMouseDown: boolean;
  isRightMouseDown: boolean;
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
  isMouseDown,
  isRightMouseDown,
}) => {
  const { isRounded, margin, ledHeight, ledWidth } = style;

  const handleClick = (e: React.MouseEvent) => {
    if (!isClickable) return;
    e.preventDefault();
    handleValueChange();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isClickable) return;
    e.preventDefault();
    if (e.button === 0) {
      if (isHalf) {
        return onChange(rowIndex, colIndex, currentBrushValue);
      }
      return onChange(rowIndex, colIndex, range.max);
    } else if (e.button === 2) {
      return onChange(rowIndex, colIndex, range.min);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isClickable) return;
    e.preventDefault();

    if (isRightMouseDown) {
      return onChange(rowIndex, colIndex, range.min);
    }

    if (isMouseDown) {
      if (isHalf) {
        return onChange(rowIndex, colIndex, currentBrushValue);
      }
      return onChange(rowIndex, colIndex, range.max);
    }
  };

  const handleValueChange = () => {
    if (isHalf) {
      if (currentBrushValue === value) {
        return onChange(rowIndex, colIndex, range.min);
      }
      return onChange(rowIndex, colIndex, currentBrushValue);
    }

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
      draggable={false}
      onContextMenu={e => e.preventDefault()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      title={`Значение: ${value}`}
    >
      <div
        style={{
          opacity: normalizeRangeValue(value, range),
        }}
        className="h-full w-full bg-[#343a40]"
      ></div>
    </button>
  );
};
