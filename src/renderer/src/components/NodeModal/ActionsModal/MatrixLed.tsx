import React, { useState } from 'react';

interface MatrixLedProps {
  rawIndex: number;
  colIndex: number;
  initValue: number;
  onChange: (rawIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixLed: React.FC<MatrixLedProps> = ({ initValue }) => {
  const [value, setValue] = useState<number>(initValue);
  const handleClick = (e: React.MouseEvent) => {
    setValue(value === 0 ? 1 : 0);
    e.stopPropagation();
  };
  return (
    <div
      className={`m-0 border-2 border-black ${value === 0 ? 'bg-gray-400' : 'bg-white'} text-black`}
    >
      <button className="h-16 w-16 text-black" type="button" onClick={handleClick}></button>
    </div>
  );
};
