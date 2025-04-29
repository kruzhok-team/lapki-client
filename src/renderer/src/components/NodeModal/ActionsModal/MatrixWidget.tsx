import React, { useState } from 'react';

import { GradientSlider } from './GradientSlider';
import { MatrixLed, MatrixStyle } from './MatrixLed';

interface MatrixWidgetProps {
  width: number;
  height: number;
  values: number[][];
  isClickable: boolean;
  style: MatrixStyle;
  showSlider: boolean;
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixWidget: React.FC<MatrixWidgetProps> = ({
  onChange,
  style,
  isClickable,
  values,
  showSlider,
}) => {
  const [brushValue, setBrushValue] = useState(100);
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
                    }}
                  />
                );
              })}
            </div>
          );
        })}
        {showSlider && (
          <div className="flex w-[300px] items-center gap-1 rounded bg-gray-100 p-2">
            <GradientSlider value={brushValue} onChange={(e) => setBrushValue(e)} />
            <span className="w-12 select-none text-center">{brushValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
