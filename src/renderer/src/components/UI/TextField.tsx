import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { TextInput } from './TextInput';

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  containerClassName?: string;
  hidden?: boolean;
  error?: boolean;
  errorMessage: string;
}

/**
 * Поле ввода с надписью и ошибкой, использует {@link TextInput}
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { label, hidden = false, error, errorMessage, className, containerClassName, ...props },
    ref
  ) => {
    return (
      <label
        className={twMerge(
          'flex flex-col',
          error && 'text-error',
          hidden && 'hidden',
          containerClassName
        )}
      >
        {label}
        <TextInput className={className} ref={ref as any} error={error} maxLength={20} {...props} />
        <p className="text-[14px] text-error">{errorMessage}</p>
      </label>
    );
  }
);
