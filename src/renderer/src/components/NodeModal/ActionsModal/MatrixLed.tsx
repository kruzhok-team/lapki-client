import { twMerge } from 'tailwind-merge';

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
    <button
      className={twMerge(
        'm-1 h-16 w-16 rounded border border-border-contrast',
        value === 0 && 'bg-matrix-inactive',
        value >= 1 && 'bg-matrix-active'
      )}
      type="button"
      onClick={handleClick}
    ></button>
  );
};
