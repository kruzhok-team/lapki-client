import { ComponentProps, forwardRef } from 'react';

import './style.css';
import { twMerge } from 'tailwind-merge';

interface TextAreaAutoResizeProps extends ComponentProps<'span'> {
  placeholder?: string;
}

export const TextAreaAutoResize = forwardRef<HTMLSpanElement, TextAreaAutoResizeProps>(
  ({ className, placeholder, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={twMerge('textarea block w-full overflow-hidden', className)}
        role="textbox"
        contentEditable
        data-placeholder={placeholder}
        {...props}
      />
    );
  }
);
