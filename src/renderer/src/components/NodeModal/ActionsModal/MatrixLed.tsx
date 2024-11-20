import React, { useState } from 'react';

interface MatrixLedProps {
  rowIndex: number;
  colIndex: number;
  value: number;
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixLed: React.FC<MatrixLedProps> = ({ colIndex, rowIndex, value, onChange }) => {
  const handleClick = (e: React.MouseEvent) => {
    const newValue = value === 0 ? 1 : 0;
    e.stopPropagation();
    onChange(rowIndex, colIndex, newValue);
  };
  return (
    <div
      className={`m-0 border-2 border-black ${value === 0 ? 'bg-gray-400' : 'bg-white'} text-black`}
    >
      <button className="h-16 w-16 text-black" type="button" onClick={handleClick}></button>
    </div>
  );
};
