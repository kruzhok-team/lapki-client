import { useFloating, offset, flip, shift } from '@floating-ui/react';

interface StateContextMenuProps {
  isOpen: boolean;
  isData: { state } | undefined;
}

export const StateContextMenu: React.FC<StateContextMenuProps> = ({ isOpen, isData }) => {
  var x = isData?.state.target.drawBounds.x;
  var y = isData?.state.target.drawBounds.y + 32;
  const virtualEl = {
    getBoundingClientRect() {
      return {
        width: isData?.state.target.bounds.width * 3.2,
        height: isData?.state.target.bounds.height,
        x: 0,
        y: 0,
        top: y,
        left: x,
        right: 0,
        bottom: 0,
      };
    },
  };

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    elements: {
      reference: virtualEl,
    },
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });

  return (
    <>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="z-50 w-52 rounded-lg bg-neutral-100 p-2"
        {...(isOpen && { 'data-show': true })}
      >
        <button className="w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white">
          Начальное состояние
        </button>
        <button className="w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white">
          Delete
        </button>
      </div>
    </>
  );
};
