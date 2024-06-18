import React, { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

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
      className={twMerge(
        'flex w-full items-center gap-2 rounded px-4 py-2 transition-colors hover:cursor-pointer hover:bg-bg-hover active:bg-bg-active',
        className
      )}
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

interface SubMenuProps extends ComponentProps<'div'> {
  position: 'left' | 'right';
}
export const SubMenu: React.FC<SubMenuProps> = ({ className, position, ...props }) => {
  return (
    <div
      className={twMerge(
        'absolute top-0 hidden w-80 flex-col rounded bg-bg-secondary p-2 shadow-xl group-hover:flex',
        className,
        position === 'left' ? 'left-full' : 'right-full'
      )}
      {...props}
    />
  );
};
