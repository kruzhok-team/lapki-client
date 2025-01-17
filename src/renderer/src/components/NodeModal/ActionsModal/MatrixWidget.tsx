import React from 'react';

import { MatrixLed, MatrixStyle } from './MatrixLed';

interface MatrixWidgetProps {
  width: number;
  height: number;
  values: number[][];
  isClickable: boolean;
  style: MatrixStyle;
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixWidget: React.FC<MatrixWidgetProps> = ({
  onChange,
  style,
  isClickable,
  values,
}) => {
  return (
    <div className="flex shrink-0 flex-col">
      {values.map((rowArr, rowIndex) => {
        return (
          <div className="flex shrink-0 flex-row">
            {rowArr.map((value, colIndex) => {
              return (
                <MatrixLed
                  key={`${rowIndex}-${colIndex}-${value}`}
                  {...{
                    style,
                    isClickable,
                    onChange,
                    rowIndex,
                    colIndex,
                    value,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
