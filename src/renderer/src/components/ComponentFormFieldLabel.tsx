import React, { ComponentProps, ReactNode } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { WithHint } from '@renderer/components/UI';

interface ComponentFormFieldLabelProps extends ComponentProps<'input'> {
  label: string | ReactNode;
  hint?: string;
  error?: string;
  as?: 'label' | 'div';
  leadingContent?: ReactNode;
  sharedGrid?: boolean;
  labelClassName?: string;
  childrenDivClassname?: string;
}

export const ComponentFormFieldLabel: React.FC<ComponentFormFieldLabelProps> = ({
  label,
  hint,
  error,
  className,
  labelClassName,
  childrenDivClassname,
  children,
  as = 'label',
  leadingContent,
  sharedGrid = false,
  ...props
}) => {
  const Component = as;

  return (
    <div className={twMerge('w-full', sharedGrid && 'contents')}>
      <Component
        className={twMerge(
          'grid w-full min-w-0 grid-cols-[max-content,minmax(0,1fr)] items-center justify-start gap-2',
          sharedGrid && 'contents'
        )}
      >
        <div
          className={twMerge(
            'flex w-20 items-center gap-1',
            sharedGrid && 'w-auto',
            labelClassName
          )}
        >
          {leadingContent}
          <span className="self-center">{label}</span>
          {hint && (
            <WithHint hint={hint}>
              {(props) => (
                <div className="shrink-0 self-center" {...props}>
                  <QuestionMark className="h-[14px] w-[14px]" />
                </div>
              )}
            </WithHint>
          )}
        </div>
        <div className={twMerge(childrenDivClassname, 'w-full min-w-0 self-center')}>
          {children || (
            <div>
              <input
                className={twMerge(
                  'h-8 w-full rounded-lg border border-border-primary bg-transparent px-2 py-1 text-text-primary outline-none focus:border-text-inactive',
                  error && '!border-error text-error',
                  className
                )}
                {...props}
                value={props.value ?? ''}
              />
            </div>
          )}
          <p className="text-xs text-error">{error}</p>
        </div>
      </Component>
    </div>
  );
};
