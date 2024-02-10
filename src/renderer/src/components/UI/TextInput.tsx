import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

interface TextInputProps extends ComponentProps<'input'> {
  error?: boolean;
}

/**
 * Просто инпут, используется в ситуации когда не подходит {@link TextField}
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  const { error, className, ...other } = props;

  return (
    <input
      className={twMerge(
        'w-full max-w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors placeholder:text-border-primary',
        error && 'border-error placeholder:text-error',
        className
      )}
      ref={ref}
      {...other}
    />
  );
});
