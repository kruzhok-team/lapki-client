import React from 'react';

interface ComponentFormFieldLabelProps {
  label: string;
  children: React.ReactNode;
}

export const ComponentFormFieldLabel: React.FC<ComponentFormFieldLabelProps> = ({
  label,
  children,
}) => {
  return (
    <label className="flex items-center gap-2">
      <span className="w-24">{label}</span>
      {children}
    </label>
  );
};
