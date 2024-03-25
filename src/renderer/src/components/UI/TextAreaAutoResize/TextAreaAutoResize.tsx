import { ComponentProps, forwardRef } from 'react';

import './style.css';
import { twMerge } from 'tailwind-merge';

interface TextAreaAutoResizeProps extends ComponentProps<'span'> {
  placeholder?: string;
}

/*
  Поле ввода которое автоматически растягивается по высоте при вводе текста
*/
export const TextAreaAutoResize = forwardRef<HTMLSpanElement, TextAreaAutoResizeProps>(
  ({ className, placeholder, onKeyDown, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={twMerge('textarea block w-full overflow-hidden', className)}
        role="textbox"
        contentEditable
        data-placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            document.execCommand('insertLineBreak');
            event.preventDefault();
          }
          onKeyDown?.(event);
        }}
        {...props}
      />
    );
  }
);
