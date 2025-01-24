import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { WithHint } from './UI';

interface AttributeConstSwitch {
  defaultIsAttribute?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  beforeSwitch?: (currentIsAttribute: boolean) => void;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  defaultIsAttribute,
  hidden,
  disabled,
  beforeSwitch,
  ...props
}) => {
  const [isAttributeInternal, setIsAttributeInternal] = useState<boolean>(
    defaultIsAttribute ?? false
  );
  const lowOpacity = 'opacity-20';
  const selectOption = (content: string, selectCondtion: boolean, hint: string) => {
    return (
      <WithHint hint={hint}>
        {(hintProps) => (
          <button
            className={twMerge('btn-secondary px-2 py-1', !selectCondtion && lowOpacity)}
            disabled={disabled ?? false}
            onClick={() => {
              if (!selectCondtion) {
                if (beforeSwitch !== undefined) {
                  beforeSwitch(isAttributeInternal);
                }
                setIsAttributeInternal(!isAttributeInternal);
              }
            }}
            type="button"
            {...hintProps}
          >
            {content}
          </button>
        )}
      </WithHint>
    );
  };
  return (
    <div className="flex-row" {...props} hidden={hidden ?? false}>
      {selectOption('🔼', isAttributeInternal, 'Атрибут компонента')}
      {selectOption('🔢', !isAttributeInternal, 'Константа')}
    </div>
  );
};
