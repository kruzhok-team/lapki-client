import React, { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';

import { ContextMenuContext, useContextMenuContext } from './ContextMenuContext';

interface ContextMenuProps {
  children: React.ReactNode;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, onClose }) => {
  return (
    <ContextMenuContext.Provider value={{ onClose }}>
      <div className="flex w-full flex-col">{children}</div>
    </ContextMenuContext.Provider>
  );
};

interface MenuItemProps extends ComponentProps<'div'> {
  closeable?: boolean;
}
export const MenuItem: React.FC<MenuItemProps> = ({
  closeable = true,
  className,
  onClick,
  ...props
}) => {
  const { onClose } = useContextMenuContext();

  return (
    <div
      className={twMerge('context-menu-item gap-2', className)}
      onClick={(e) => {
        onClick?.(e);

        if (closeable) onClose();
      }}
      {...props}
    />
  );
};

type SubMenuContainerProps = ComponentProps<'div'>;
export const SubMenuContainer: React.FC<SubMenuContainerProps> = ({ className, ...props }) => {
  return <div className={twMerge('group relative', className)} {...props} />;
};

export const SubMenuArrow: React.FC = () => (
  <ArrowIcon
    aria-hidden="true"
    className="context-menu-arrow ml-auto size-2.5 shrink-0 -rotate-90"
  />
);

interface SubMenuProps extends ComponentProps<'div'> {
  position: 'left' | 'right';
}
export const SubMenu: React.FC<SubMenuProps> = ({ className, position, ...props }) => {
  return (
    <div
      className={twMerge(
        'dropdown-menu absolute top-0 hidden w-80 flex-col group-hover:flex',
        className,
        position === 'left' ? 'left-full' : 'right-full'
      )}
      {...props}
    />
  );
};
