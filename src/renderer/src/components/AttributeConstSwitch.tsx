import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { WithHint } from './UI';

interface AttributeConstSwitch {
  isAttributeSelected?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  isAttributeSelected: isAttributeOutside,
  hidden,
  disabled,
  ...props
}) => {
  const [isAttributeInternal, setIsAttributeInternal] = useState<boolean>(
    isAttributeOutside ?? false
  );
  const lowOpacity = 'opacity-20';
  const selectOption = (
    content: string,
    selectCondtion: boolean,
    setCondition: () => void,
    hint: string
  ) => {
    return (
      <WithHint hint={hint}>
        {(hintProps) => (
          <button
            className={twMerge('btn-secondary px-2 py-1', !selectCondtion && lowOpacity)}
            disabled={disabled ?? false}
            onClick={() => setCondition()}
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
      {selectOption(
        '❎',
        isAttributeInternal,
        () => setIsAttributeInternal(true),
        'Атрибут компонента'
      )}
      {selectOption('✏', !isAttributeInternal, () => setIsAttributeInternal(false), 'Константа')}
    </div>
  );
};
