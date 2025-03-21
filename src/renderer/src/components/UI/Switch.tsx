import React from 'react';

import * as RSwitch from '@radix-ui/react-switch';
import { twMerge } from 'tailwind-merge';

export const Switch: React.FC<RSwitch.SwitchProps> = (props) => {
  const { className, ...other } = props;
  return (
    <RSwitch.Root
      className={twMerge(
        'relative h-[25px] w-[42px] cursor-pointer rounded-full bg-bg-primary shadow-border-primary outline-none data-[state=checked]:bg-primary data-[state=unchecked]:shadow-[0_0_0_1px] data-[state=unchecked]:shadow-border-primary focus:shadow-[0_0_0_1px]',
        className && className
      )}
      style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      {...other}
    >
      <RSwitch.Thumb className="block size-[21px] translate-x-0.5 rounded-full bg-text-inactive transition duration-100 will-change-transform data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-text-primary" />
    </RSwitch.Root>
  );
};
