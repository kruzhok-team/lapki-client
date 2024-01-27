import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

interface TextInputProps extends ComponentProps<'input'> {
  label: string;
  hidden?: boolean;
  error?: boolean;
  errorMessage: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, hidden = false, error, errorMessage, className, ...props }, ref) => {
    return (
      <label className={twMerge('mx-1 flex flex-col', error && 'text-error', hidden && 'hidden')}>
        {label}
        <input
          className={twMerge(
            'w-[250px] max-w-[250px] rounded border border-border-primary bg-transparent px-2 py-1 text-text-primary outline-none transition-colors',
            error && 'border-error placeholder:text-error',
            className
          )}
          ref={ref}
          maxLength={20}
          {...props}
        />
        <p className="min-h-[24px] text-[14px] text-error">{errorMessage}</p>
      </label>
    );
  }
);
