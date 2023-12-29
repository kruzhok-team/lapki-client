import React, { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { WithHint } from '@renderer/components/UI';

interface ComponentFormFieldLabelProps extends ComponentProps<'input'> {
  label: string;
  hint?: string;
  error?: string;
}

export const ComponentFormFieldLabel: React.FC<ComponentFormFieldLabelProps> = ({
  label,
  hint,
  error,
  className,
  children,
  ...props
}) => {
  return (
    <div>
      <label className="flex items-center gap-2">
        <div className="flex w-28 items-center gap-1">
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
              'w-[250px] rounded border border-border-primary bg-transparent px-2 py-1 text-text-primary outline-none focus:border-text-primary',
              error && '!border-error text-error',
              className
            )}
            {...props}
          />
        )}
      </label>
      <p className="pl-[120px] text-sm text-error">{error}</p>
    </div>
  );
};
