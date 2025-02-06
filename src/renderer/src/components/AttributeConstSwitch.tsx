import React from 'react';

import { Switch, WithHint } from './UI';

interface AttributeConstSwitch {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  checked,
  onCheckedChange,
  ...props
}) => {
  return (
    <div {...props}>
      <WithHint
        hint={checked ? 'Переключиться на константу' : 'Переключиться на атрибут компонента'}
      >
        {(hintProps) => (
          <div {...hintProps}>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
          </div>
        )}
      </WithHint>
    </div>
  );
};
