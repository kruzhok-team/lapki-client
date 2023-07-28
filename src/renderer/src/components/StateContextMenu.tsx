import React, { useRef } from 'react';
import { usePopper } from 'react-popper';
import { DiagramEditor } from './DiagramEditor';

interface StateContextMenuProps {}

interface StateContextMenuProps {
  isOpen: boolean;
  isData: { state } | undefined;
}

const virtualReference = {
  getBoundingClientRect(x = 0, y = 0) {
    return {
      width: 100,
      height: 200,
      x: x,
      y: y,
    } as DOMRect;
  },
};

export const StateContextMenu: React.FC<StateContextMenuProps> = () => {
  const [popperElement, setPopperElement] = React.useState(null);
  const { styles, attributes } = usePopper(virtualReference, popperElement);
  const Inc = { styles, attributes };

  document.addEventListener('mousemove', ({ clientX: x, clientY: y }) => {
    console.log(x, y);
    virtualReference.getBoundingClientRect(x, y);
  });
  return (
    <div
      className="z-50 flex flex-col rounded-lg bg-neutral-800 p-4 text-neutral-100 outline-none"
      ref={popperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      Context menu
      <div>
        Начальное состояние:
        <input type="checkbox"></input>
      </div>
      <button type="button">Удалить</button>
    </div>
  );
};
