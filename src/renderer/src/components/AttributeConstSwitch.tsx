import React from 'react';

import { Switch, WithHint } from './UI';

interface AttributeConstSwitch {
  checked?: boolean;
  onCheckedChange?: (isAttribute: boolean) => void;
  hint?: string;
  className?: string;
  isDisabled?: boolean;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  checked,
  onCheckedChange,
  hint,
  className,
  isDisabled,
  ...props
}) => {
  return (
    <div {...props}>
      <WithHint hint={hint}>
        {(hintProps) => (
          <div {...hintProps}>
            <Switch
              className={className}
              checked={checked}
              disabled={isDisabled}
              onCheckedChange={onCheckedChange}
            />
          </div>
        )}
      </WithHint>
    </div>
  );
};
