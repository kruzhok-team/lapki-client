import React from 'react';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { WithHint } from '@renderer/components/UI';

interface ComponentFormFieldLabelProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const ComponentFormFieldLabel: React.FC<ComponentFormFieldLabelProps> = ({
  label,
  hint,
  children,
}) => {
  return (
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
      {children}
    </label>
  );
};
