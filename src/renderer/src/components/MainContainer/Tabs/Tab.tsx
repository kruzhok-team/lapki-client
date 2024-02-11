import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { ReactComponent as CodeIcon } from '@renderer/assets/icons/code.svg';
import { ReactComponent as EditorIcon } from '@renderer/assets/icons/editor.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { Tab as TabType } from '@renderer/types/tabs';

interface TabProps {
  isActive: boolean;
  isDragging: boolean;
  draggable: boolean;
  type: TabType['type'];
  name: string;
  showName: boolean;
  canClose: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onMouseDown: () => void;
  onClose: () => void;
}

export const Tab: React.FC<TabProps> = (props) => {
  const {
    draggable,
    isDragging,
    isActive,
    type,
    name,
    showName,
    canClose,
    onDragStart,
    onDrop,
    onMouseDown,
    onClose,
  } = props;

  const TabIcon = {
    editor: <EditorIcon />,
    code: <CodeIcon />,
    transition: <TransitionIcon />,
    state: <StateIcon />,
  };
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggable) {
      e.dataTransfer.dropEffect = 'none';
    }

    if (!isDragging && draggable) setDragOver(true);
  };

  const handleDragLeave = () => {
    if (!isDragging && draggable) setDragOver(false);
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
    <div
      draggable={draggable}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      className={twMerge(
        'group flex cursor-pointer items-center rounded p-1 px-2 transition hover:bg-bg-primary',
        isActive && 'bg-bg-primary',
        dragOver && 'bg-bg-primary'
      )}
      onMouseDown={onMouseDown}
    >
      {TabIcon[type]}

      {showName && (
        <span title={name} className="ml-1 line-clamp-1 w-20 text-left">
          {name}
        </span>
      )}

      {canClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={twMerge(
            'hover:bg-bg-btn rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100',
            isActive && 'opacity-100'
          )}
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
