import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

interface TextInputProps extends ComponentProps<'input'> {
  label: string;
  containerClassName?: string;
  hidden?: boolean;
  error?: boolean;
  errorMessage: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    { label, hidden = false, error, errorMessage, className, containerClassName, ...props },
    ref
  ) => {
    return (
      <label
        className={twMerge(
          'mb-2 mr-2 flex flex-col',
          error && 'text-error',
          hidden && 'hidden',
          containerClassName
        )}
      >
        {label}
        <input
          className={twMerge(
            'w-full max-w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors placeholder:text-border-primary',
            error && 'border-error placeholder:text-error',
            className
          )}
          ref={ref}
          maxLength={20}
          {...props}
        />
        <p className="text-[14px] text-error">{errorMessage}</p>
      </label>
    );
  }
);
