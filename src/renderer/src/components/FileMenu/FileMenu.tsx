import React, { cloneElement } from 'react';

import { twMerge } from 'tailwind-merge';

import type { FileMenuItem, FileMenuItemId } from '@renderer/hooks/useFileMenu';

import { Badge, DropdownMenu, DropdownMenuItem, WithHint } from '../UI';

const compactMenuItemIds = new Set<FileMenuItemId>([
  'new',
  'open',
  'open-recent',
  'save',
  'save-as',
  'import',
  'properties',
]);

export type FileMenuVariant = 'dropdown' | 'inline';

interface FileMenuProps {
  items: FileMenuItem[];
  variant: FileMenuVariant;
  onItemSelect?: () => void;
}

interface FileMenuItemProps {
  item: FileMenuItem;
  onItemSelect?: () => void;
}

interface WithMenuItemHintProps {
  hint?: string;
  children: React.ReactElement;
}

const WithMenuItemHint: React.FC<WithMenuItemHintProps> = ({ hint, children }) =>
  hint ? (
    <WithHint hint={hint}>{(hintProps) => cloneElement(children, hintProps)}</WithHint>
  ) : (
    children
  );

const visibleFileMenuItems = (items: FileMenuItem[]) =>
  items.filter(({ id, hidden = false }) => !hidden && compactMenuItemIds.has(id));

const FileMenuDropdownItem: React.FC<FileMenuItemProps> = ({ item, onItemSelect }) => {
  const { text, onClick, disabled = false, className, badge, hint } = item;

  return (
    <WithMenuItemHint hint={hint}>
      <DropdownMenuItem
        className={twMerge('py-[5px] leading-none enabled:hover:bg-[#e4f2ff]', className)}
        onClick={() => {
          onClick();
          onItemSelect?.();
        }}
        disabled={disabled}
      >
        <Badge show={badge ?? false}>{text}</Badge>
      </DropdownMenuItem>
    </WithMenuItemHint>
  );
};

const FileMenuInlineItem: React.FC<FileMenuItemProps> = ({ item }) => {
  const { text, onClick, disabled = false, className, badge, hint } = item;

  return (
    <WithMenuItemHint hint={hint}>
      <button
        type="button"
        role="menuitem"
        className={twMerge(
          'flex w-full items-center rounded-lg px-3 py-[5px] text-left text-xs leading-none outline-none transition-colors focus-visible:bg-[#e6f4ff] enabled:hover:bg-[#e4f2ff] enabled:active:bg-bg-active disabled:cursor-not-allowed disabled:text-text-disabled disabled:opacity-50',
          className
        )}
        onClick={onClick}
        disabled={disabled}
      >
        <Badge show={badge ?? false}>{text}</Badge>
      </button>
    </WithMenuItemHint>
  );
};

const FileMenuDropdown: React.FC<Omit<FileMenuProps, 'variant'>> = ({ items, onItemSelect }) => (
  <DropdownMenu className="flex flex-col">
    {visibleFileMenuItems(items).map((item) => (
      <FileMenuDropdownItem key={item.id} item={item} onItemSelect={onItemSelect} />
    ))}
  </DropdownMenu>
);

const FileMenuInline: React.FC<Omit<FileMenuProps, 'variant'>> = ({ items }) => (
  <div role="menu" className="flex flex-col">
    {visibleFileMenuItems(items).map((item) => (
      <FileMenuInlineItem key={item.id} item={item} />
    ))}
  </div>
);

export const FileMenu: React.FC<FileMenuProps> = ({ variant, ...props }) =>
  variant === 'dropdown' ? <FileMenuDropdown {...props} /> : <FileMenuInline {...props} />;
