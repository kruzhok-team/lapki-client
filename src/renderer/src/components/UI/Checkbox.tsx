import React from 'react';

import * as RCheckbox from '@radix-ui/react-checkbox';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as CheckIcon } from '@renderer/assets/icons/check.svg';

export const Checkbox: React.FC<RCheckbox.CheckboxProps> = ({ className, ...props }) => {
  return (
    <RCheckbox.Root
      className={twMerge(
        'min-w-5 flex h-5 w-5 appearance-none items-center justify-center rounded border border-border-primary outline-none',
        className
      )}
      {...props}
    >
      <RCheckbox.Indicator className="text-text-primary">
        <CheckIcon className="scale-75" />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
};
