import React from 'react';

import { MatrixLed } from './MatrixLed';

interface MatrixWidgetProps {
  width: number;
  height: number;
  values: number[][];
  onChange: (rawIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixWidget: React.FC<MatrixWidgetProps> = ({ onChange, width, height, values }) => {
  return (
    <div className="flex flex-col">
      {values.map((raw, rawIndex) => {
        return (
          <div className="flex-raw flex">
            {raw.map((col, colIndex) => {
              return <MatrixLed {...{ onChange, rawIndex, colIndex, initValue: col }} />;
            })}
          </div>
        );
      })}
    </div>
  );
};
