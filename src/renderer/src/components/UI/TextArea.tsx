import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

interface TextAreaProps extends ComponentProps<'textarea'> {
  error?: boolean;
}

// TODO(bryzZz) Нужно как-то обьеденить TextInput и TextArea компонент в один, чтобы стили не синхронизировать
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { error, className, ...other } = props;

  return (
    <textarea
      className={twMerge(
        'w-full max-w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors placeholder:text-border-primary',
        'scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb',
        error && 'border-error placeholder:text-error',
        className
      )}
      ref={ref}
      {...other}
    />
  );
});
