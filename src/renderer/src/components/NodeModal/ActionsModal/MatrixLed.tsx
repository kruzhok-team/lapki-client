import { twMerge } from 'tailwind-merge';

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
  onChange: (rowIndex: number, colIndex: number, newValue: number) => void;
}

export const MatrixLed: React.FC<MatrixLedProps> = ({
  isClickable,
  colIndex,
  rowIndex,
  value,
  onChange,
  style,
}) => {
  const { isRounded, margin, ledHeight, ledWidth } = style;
  return (
    <button
      style={{
        height: ledHeight * 4,
        margin: margin * 4,
        width: ledWidth * 4,
      }}
      className={twMerge(
        'border-2 border-border-primary',
        value === 0 && 'bg-matrix-inactive',
        value >= 1 && 'bg-matrix-active',
        isRounded && 'rounded'
      )}
      type="button"
      onClick={
        isClickable ? onChange.bind(this, rowIndex, colIndex, value === 0 ? 1 : 0) : undefined
      }
    ></button>
  );
};
