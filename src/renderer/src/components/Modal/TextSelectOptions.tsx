import { ComponentProps, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface option {
  value: any;
  label: string;
}

interface TextSelectProps extends ComponentProps<'select'> {
  label: string;
  //value - переменная содержащая данные события, на который кликнули
  isElse: boolean;
  error?: boolean;
  errorMessage: string;
  options: option[];
}
export const SELECT_LOCAL = 'local';
export const SELECT_REMOTE = 'remote';
export const TextSelectOptions = forwardRef<HTMLSelectElement, TextSelectProps>(
  ({ label, isElse, error, errorMessage, ...props }, ref) => {
    return (
      <label
        className={twMerge('mx-1 flex flex-col ', error && 'text-red-500', isElse && 'hidden')}
      >
        {label}
        <select
          className={twMerge(
            'h-[34px] w-[200px] max-w-[200px] rounded border bg-transparent px-2 py-1 outline-none transition-colors',
            error && 'border-red-500 placeholder:text-red-500',
            !error && 'border-neutral-200 text-neutral-50 focus:border-neutral-50'
          )}
          ref={ref}
          {...props}
        >
          {props.options.map((option) => (
            <option
              className="bg-neutral-800"
              key={'option' + option.value}
              value={option.value}
              label={option.label}
            />
          ))}
        </select>
        <p className="min-h-[24px] text-[14px] text-red-500">{errorMessage}</p>
      </label>
    );
  }
);
