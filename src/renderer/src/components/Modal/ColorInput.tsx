import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

interface ColorInputProps extends ComponentProps<'input'> {
  label: string;
  error?: boolean;
  errorMessage: string;
}

export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ label, error, errorMessage, ...props }, ref) => {
    return (
      <label className={twMerge('m-2 flex', error && 'text-error')}>
        <span className="font-bold">{label}</span>
        <input
          className={twMerge(
            'ml-2 rounded border border-border-primary bg-transparent outline-none transition-colors',
            error && 'border-error placeholder:text-error'
          )}
          ref={ref}
          type="color"
          {...props}
        />
        <p className="min-h-[24px] text-[14px] text-error">{errorMessage}</p>
      </label>
    );
  }
);
