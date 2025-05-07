import React from 'react';

import * as RSwitch from '@radix-ui/react-switch';

import { WithHint } from './UI';
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
            {/* <Switch
              className={className}
              checked={checked}
              disabled={isDisabled}
              onCheckedChange={onCheckedChange}
            /> */}
            <RSwitch.Root
              className={
                'relative h-[25px] w-[42px] cursor-pointer rounded-full bg-bg-secondary shadow-[0_0_0_1px] shadow-border-primary outline-none'
              }
              id="airplane-mode"
              checked={checked}
              disabled={isDisabled}
              onCheckedChange={onCheckedChange}
            >
              <RSwitch.Thumb className="block size-[21px] translate-x-0.5 rounded-full shadow-[0_0_0_1px] shadow-border-contrast transition duration-100 will-change-transform data-[state=checked]:translate-x-[19px]">
                {checked ? 'А' : 'К'}
              </RSwitch.Thumb>
            </RSwitch.Root>
          </div>
        )}
      </WithHint>
    </div>
  );
};
