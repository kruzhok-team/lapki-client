import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { WithHint } from '@renderer/components/UI';

interface ComponentProps {
  name: string;
  isSelected: boolean;
  isDragging: boolean;
  icon?: React.ReactNode;
  description?: string;
  onSelect: () => void;
  onEdit: () => void;
  onCallContextMenu: () => void; // TODO: Сделать контекстное меню для машин состояний
  onDelete: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}

export const Component: React.FC<ComponentProps> = (props) => {
  const {
    name,
    isSelected,
    isDragging,
    onSelect,
    onEdit,
    onDelete,
    onDragStart,
    onDrop,
    onCallContextMenu,
    description,
    icon,
  } = props;

  const [dragOver, setDragOver] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Delete') return;

    onDelete();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (!isDragging) setDragOver(true);
  };

  const handleDragLeave = () => {
    if (!isDragging) setDragOver(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';

    onDragStart();
  };

  const handleDrop = () => {
    onDrop();
    setDragOver(false);
  };

  return (
    <WithHint key={name} hint={description ?? ''} placement="right">
      {(props) => (
        <button
          type="button"
          className={twMerge(
            'flex w-full items-center p-1',
            (isSelected || dragOver) && 'bg-bg-active'
          )}
          onClick={onSelect}
          onAuxClick={onDelete}
          onDoubleClick={onEdit}
          onContextMenu={onCallContextMenu}
          onKeyDown={handleKeyDown}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          draggable
          {...props}
        >
          {icon}
          <p className="ml-2 line-clamp-1">{name}</p>
        </button>
      )}
    </WithHint>
  );
};
