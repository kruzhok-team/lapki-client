import React, { useRef } from 'react';
import { usePopper } from 'react-popper';

interface StateContextMenuProps {}

const virtualReference = {
  getBoundingClientRect() {
    return {
      top: 10,
      left: 10,
      bottom: 20,
      right: 100,
      width: 90,
      height: 10,
    };
  },
} as any;

export const StateContextMenu: React.FC<StateContextMenuProps> = () => {
  const popperElementRef = useRef<HTMLDivElement>(null);

  const { styles, attributes } = usePopper(virtualReference, popperElementRef.current);

  console.log(attributes);

  return (
    <div className="z-50" ref={popperElementRef} style={styles.popper} {...attributes.popper}>
      Context menu
    </div>
  );
};
