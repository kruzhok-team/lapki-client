import React from 'react';

import { Switch, WithHint } from './UI';

interface AttributeConstSwitch {
  isAttribute?: boolean;
  onCheckedChange?: (isAttribute: boolean) => void;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  isAttribute,
  onCheckedChange,
  ...props
}) => {
  return (
    <div {...props}>
      <WithHint
        hint={isAttribute ? 'Переключиться на константу' : 'Переключиться на атрибут компонента'}
      >
        {(hintProps) => (
          <div {...hintProps}>
            <Switch checked={isAttribute} onCheckedChange={onCheckedChange} />
          </div>
        )}
      </WithHint>
    </div>
  );
};
