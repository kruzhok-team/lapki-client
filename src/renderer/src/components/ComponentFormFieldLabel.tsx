import React, { ComponentProps, ReactNode } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { WithHint } from '@renderer/components/UI';

interface ComponentFormFieldLabelProps extends ComponentProps<'input'> {
  label: string | ReactNode;
  hint?: string;
  error?: string;
  as?: 'label' | 'div';
  labelClassName?: string;
}

export const ComponentFormFieldLabel: React.FC<ComponentFormFieldLabelProps> = ({
  label,
  hint,
  error,
  className,
  labelClassName,
  children,
  as = 'label',
  ...props
}) => {
  const Component = as;

  return (
    <div>
      <Component className="grid grid-cols-[max-content,1fr] items-center justify-start gap-2">
        <div className={twMerge('flex min-w-32 items-center gap-1', labelClassName)}>
          <span>{label}</span>
          {hint && (
            <WithHint hint={hint}>
              {(props) => (
                <div className="shrink-0" {...props}>
                  <QuestionMark className="h-5 w-5" />
                </div>
              )}
            </WithHint>
          )}
        </div>
        {children || (
          <input
            className={twMerge(
              'rounded border border-border-primary bg-transparent px-2 py-1 text-text-primary outline-none focus:border-text-primary',
              error && '!border-error text-error',
              className
            )}
            {...props}
            value={props.value ?? ''}
          />
        )}
      </Component>
      <p className="pl-[120px] text-sm text-error">{error}</p>
    </div>
  );
};
