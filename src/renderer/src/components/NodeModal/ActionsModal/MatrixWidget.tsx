import React, { useState, useEffect } from 'react';

import { Range } from '@renderer/types/utils';
import { DEFAULT_RANGE_STEP } from '@renderer/utils';

import { GradientSlider } from './GradientSlider';
import { MatrixLed, MatrixStyle } from './MatrixLed';

interface MatrixWidgetProps {
  width: number;
  height: number;
  values: number[][];
  isClickable: boolean;
  style: MatrixStyle;
  isHalf: boolean;
  range: Range;
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixWidget: React.FC<MatrixWidgetProps> = ({
  onChange,
  style,
  isClickable,
  values,
  isHalf,
  range,
}) => {
  const [brushValue, setBrushValue] = useState(range.max);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
      setIsRightMouseDown(false);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isClickable) return;

      if (e.button === 0) {
        setIsMouseDown(true);
      } else if (e.button === 2) {
        setIsRightMouseDown(true);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isClickable]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex shrink-0 flex-col">
        {values.map((rowArr, rowIndex) => {
          return (
            <div key={`div-${rowIndex}`} className="flex shrink-0 flex-row">
              {rowArr.map((value, colIndex) => {
                return (
                  <MatrixLed
                    key={`mtrx-${rowIndex}-${colIndex}-${value}`}
                    {...{
                      style,
                      isClickable,
                      onChange,
                      rowIndex,
                      colIndex,
                      value,
                      currentBrushValue: brushValue,
                      range,
                      isHalf,
                      isMouseDown,
                      isRightMouseDown,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
        {isHalf && (
          <div className="flex w-[300px] items-center gap-1 rounded  p-2">
            <GradientSlider
              step={range.step ?? DEFAULT_RANGE_STEP}
              range={range}
              value={brushValue}
              onChange={(e) => setBrushValue(e)}
            />
            <span className="w-12 select-none text-center">{brushValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
