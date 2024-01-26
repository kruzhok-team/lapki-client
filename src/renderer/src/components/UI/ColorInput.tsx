import { ComponentProps, forwardRef } from 'react';

interface ColorInputProps extends ComponentProps<'input'> {
  label: string;
}

export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ label, ...props }, ref) => {
    return (
      <label className="m-2 flex">
        <span className="font-bold">{label}</span>
        <input
          className="ml-2 rounded border border-border-primary bg-transparent outline-none transition-colors"
          ref={ref}
          type="color"
          {...props}
        />
      </label>
    );
  }
);
