import { AriaRole, ButtonHTMLAttributes, HTMLAttributes, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { ReactComponent as CheckIcon } from '@renderer/assets/icons/check.svg';

export type DropdownMenuProps = HTMLAttributes<HTMLDivElement>;

export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, role = 'menu', ...props }, ref) => (
    <div ref={ref} role={role} className={twMerge('dropdown-menu', className)} {...props} />
  )
);

DropdownMenu.displayName = 'DropdownMenu';

type DropdownMenuItemBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-checked' | 'aria-haspopup' | 'role'
>;

export type DropdownMenuItemProps = DropdownMenuItemBaseProps &
  (
    | {
        role: 'menuitemradio';
        'aria-checked': boolean;
        'aria-haspopup'?: never;
      }
    | {
        role?: Exclude<AriaRole, 'menuitemradio'>;
        'aria-checked'?: never;
        'aria-haspopup'?: ButtonHTMLAttributes<HTMLButtonElement>['aria-haspopup'];
      }
  );

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  (
    {
      children,
      className,
      role = 'menuitem',
      type = 'button',
      'aria-checked': ariaChecked,
      'aria-haspopup': ariaHasPopup,
      ...props
    },
    ref
  ) => {
    const isRadioItem = role === 'menuitemradio';
    const hasSubmenu = ariaHasPopup === 'menu' || ariaHasPopup === true;

    return (
      <button
        ref={ref}
        type={type}
        role={role}
        aria-checked={ariaChecked}
        aria-haspopup={ariaHasPopup}
        className={twMerge('dropdown-menu-item', className)}
        {...props}
      >
        {children}
        {isRadioItem && (
          <span
            aria-hidden="true"
            className="ml-auto flex size-2.5 shrink-0 items-center justify-center"
          >
            {ariaChecked && <CheckIcon />}
          </span>
        )}
        {hasSubmenu && (
          <ArrowIcon aria-hidden="true" className="ml-auto size-2.5 shrink-0 -rotate-90" />
        )}
      </button>
    );
  }
);

DropdownMenuItem.displayName = 'DropdownMenuItem';
