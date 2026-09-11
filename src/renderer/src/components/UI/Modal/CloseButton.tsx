import { ButtonHTMLAttributes } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';

interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ className, iconClassName, ...props }) => (
  <button
    type="button"
    className={twMerge('rounded-[3px] transition-colors hover:bg-util-button-hover', className)}
    {...props}
  >
    <Close className={twMerge(iconClassName)} />
  </button>
);
