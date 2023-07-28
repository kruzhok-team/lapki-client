import React, { useLayoutEffect, useRef } from 'react';
import { usePopper } from 'react-popper';

interface StateContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
}

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x,
  });
}

const virtualReference = {
  getBoundingClientRect: generateGetBoundingClientRect(),
} as any;

export const StateContextMenu: React.FC<StateContextMenuProps> = ({ x, y, isOpen }) => {
  const popperElementRef = useRef<HTMLDivElement>(null);

  const { styles, attributes, update } = usePopper(virtualReference, popperElementRef.current, {
    placement: 'right-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [5, 5],
        },
      },
    ],
  });

  useLayoutEffect(() => {
    virtualReference.getBoundingClientRect = generateGetBoundingClientRect(x, y);

    update?.();
  }, [x, y]);

  // useEffect(() => {
  //   const fn = () => {

  //   }

  //   document.body.addEventListener()
  // });

  return (
    <div
      className="bg z-50 w-48 rounded-lg bg-[#404040] p-2 text-neutral-100 outline-none"
      ref={popperElementRef}
      style={styles.popper}
      {...attributes.popper}
      {...(isOpen && { 'data-show': true })}
    >
      <button className="w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white">
        Delete
      </button>
    </div>
  );
};
