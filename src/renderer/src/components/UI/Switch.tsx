import React from 'react';

import * as RSwitch from '@radix-ui/react-switch';
import { twMerge } from 'tailwind-merge';

export const Switch: React.FC<RSwitch.SwitchProps> = (props) => {
  const { className, ...other } = props;
  return (
    <RSwitch.Root
      className={twMerge(
        'relative box-border block h-[18px] min-h-[18px] w-[30px] min-w-[30px] shrink-0 cursor-pointer rounded-full bg-switch-inactive-bg p-[2px] outline-none data-[state=checked]:bg-icon-selected-bg',
        className && className
      )}
      style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      {...other}
    >
      <RSwitch.Thumb className="block size-[14px] rounded-full bg-text-inactive bg-white transition duration-100 will-change-transform data-[state=checked]:translate-x-[12px]" />
    </RSwitch.Root>
  );
};
