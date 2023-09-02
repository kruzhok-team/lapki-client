import React from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';

import { Point } from '@renderer/types/graphics';
import { getVirtualElement } from '@renderer/utils';
import { useClickOutside } from '@renderer/hooks/useClickOutside';
import { twMerge } from 'tailwind-merge';

interface DiagramContextMenuProps {
  items: { label: string; action: () => void }[];
  position: Point;

  isOpen: boolean;
  onClose: () => void;
}

export const DiagramContextMenu: React.FC<DiagramContextMenuProps> = (props) => {
  const { position, items, isOpen, onClose } = props;

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    elements: {
      reference: getVirtualElement(position),
    },
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });

  useClickOutside(refs.floating.current, onClose, !isOpen);

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={twMerge('z-50 w-56 rounded bg-bg-secondary p-2 shadow-xl', !isOpen && 'hidden')}
    >
      {items.map(({ label, action }, i) => (
        <button
          key={i}
          className="w-full rounded px-4 py-2 transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled"
          onClick={() => {
            action();
            onClose();
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
