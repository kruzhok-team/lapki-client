import React from 'react';

import { MatrixLed } from './MatrixLed';

interface MatrixWidgetProps {
  width: number;
  height: number;
  values: number[][];
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixWidget: React.FC<MatrixWidgetProps> = ({ onChange, values }) => {
  return (
    <div className="flex flex-col">
      {values.map((rowArr, rowIndex) => {
        return (
          <div className="flex flex-row">
            {rowArr.map((value, colIndex) => {
              return <MatrixLed {...{ onChange, rowIndex, colIndex, value }} />;
            })}
          </div>
        );
      })}
    </div>
  );
};
