import { useFloating, offset, flip, shift } from '@floating-ui/react';

interface StateContextMenuProps {
  isOpen: boolean;
  isData: { state } | undefined;
}

export const StateContextMenu: React.FC<StateContextMenuProps> = ({ isOpen, isData }) => {
  var x = isData?.state.target.drawBounds.x;
  var y = isData?.state.target.drawBounds.y;
  console.log(x, y);
  const virtualEl = {
    getBoundingClientRect() {
      return {
        width: isData?.state.target.bounds.width,
        height: isData?.state.target.bounds.height,
        x: x,
        y: y,
        top: y,
        left: x,
        right: x,
        bottom: y,
      };
    },
  };

  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: virtualEl,
    },
    middleware: [offset(), flip(), shift()],
  });
  function Close() {
    isOpen = false;
  }

  return (
    <>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="z-50 w-48 rounded-sm bg-neutral-100 py-2"
        {...(isOpen && { 'data-show': true })}
      >
        <button
          className="w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white"
          onClick={Close}
        >
          Delete
        </button>
      </div>
    </>
  );
};
