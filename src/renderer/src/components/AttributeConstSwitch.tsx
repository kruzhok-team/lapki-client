import React from 'react';

import * as RSwitch from '@radix-ui/react-switch';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as AttributeIcon } from '@renderer/assets/icons/useAttribute.svg';
import { ReactComponent as ConstIcon } from '@renderer/assets/icons/useConst.svg';

import { WithHint } from './UI';
interface AttributeConstSwitch {
  isAttribute?: boolean;
  onCheckedChange?: (isAttribute: boolean) => void;
  className?: string;
  isDisabled?: boolean;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  isAttribute,
  onCheckedChange,
  className,
  isDisabled,
  ...props
}) => {
  return (
    <div {...props}>
      <WithHint
        hint={isAttribute ? 'Переключиться на константу' : 'Переключиться на атрибут компонента'}
      >
        {(hintProps) => (
          <div {...hintProps}>
            <RSwitch.Root
              className={twMerge(
                'relative h-[25px] w-[42px] cursor-pointer rounded-full bg-bg-secondary shadow-[0_0_0_1px] shadow-border-primary outline-none focus:shadow-[0_0_0_1px]',
                className
              )}
              id="airplane-mode"
              checked={isAttribute}
              disabled={isDisabled}
              onCheckedChange={onCheckedChange}
            >
              <RSwitch.Thumb className="block size-[21px] translate-x-0.5 rounded-full shadow-[0_0_0_1px] shadow-border-contrast transition duration-100 will-change-transform data-[state=checked]:translate-x-[19px]">
                {isAttribute ? <AttributeIcon /> : <ConstIcon />}
              </RSwitch.Thumb>
            </RSwitch.Root>
          </div>
        )}
      </WithHint>
    </div>
  );
};
