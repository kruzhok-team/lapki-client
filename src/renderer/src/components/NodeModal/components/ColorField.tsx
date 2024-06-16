import React from 'react';

import { ColorInput } from '@renderer/components/UI';

interface ColorFieldProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
}

export const ColorField: React.FC<ColorFieldProps> = ({ value, onChange, label }) => {
  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">{label}</p>
      <ColorInput clearable value={value} onChange={onChange} />
    </div>
  );
};
