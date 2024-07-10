import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { WithHint } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';

interface ComponentProps {
  name: string;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}

export const Component: React.FC<ComponentProps> = (props) => {
  const { name, isSelected, isDragging, onSelect, onEdit, onDelete, onDragStart, onDrop } = props;

  const { controller, model } = useEditorContext();

  const [dragOver, setDragOver] = useState(false);

  const proto = controller.platform?.getComponent(name);

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
    <WithHint key={name} hint={proto?.description ?? ''} placement="right">
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
          onContextMenu={onEdit}
          onKeyDown={handleKeyDown}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          draggable
          {...props}
        >
          {controller.platform?.getFullComponentIcon(name)}
          <p className="ml-2 line-clamp-1">{name}</p>
        </button>
      )}
    </WithHint>
  );
};
