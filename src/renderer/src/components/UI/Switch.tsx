import React from 'react';

import * as RSwitch from '@radix-ui/react-switch';

export const Switch: React.FC<RSwitch.SwitchProps> = (props) => {
  return (
    <RSwitch.Root
      className="relative h-[25px] w-[42px] cursor-pointer rounded-full border border-border-primary bg-bg-primary outline-none"
      style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      {...props}
    >
      <RSwitch.Thumb className="block h-[21px] w-[21px] translate-x-[1px] rounded-full bg-text-primary transition duration-100 will-change-transform data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  );
};
