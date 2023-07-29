import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

interface StateContextMenuProps {
  isOpen: boolean;
  isData: { state } | undefined;
  onClickDelState: (data) => void;
  onClickInitial: (data) => void;
  onClickDelTran: (data) => void;
}

export interface ContextMenu {
  id: string;
}

export const StateContextMenu: React.FC<StateContextMenuProps> = ({
  isOpen,
  isData,
  onClickDelState,
  onClickInitial,
  onClickDelTran,
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm<ContextMenu>();
  const handleClick = hookHandleSubmit((data) => {
    data.id = isData?.state.id;
    onClickDelState(data);

    data.id = isData?.state.bounds;
    console.log(data.id);
    onClickDelTran(data);
  });

  const handleInitialState = hookHandleSubmit((data) => {
    data.id = isData?.state.id;
    onClickInitial(data);
  });

  var x = isData?.state.computedPosition.x;
  var y = isData?.state.computedPosition.y + 26;
  const virtualEl = {
    getBoundingClientRect() {
      return {
        width: isData?.state.computedWidth + 20,
        height: isData?.state.computedHeight + 20,
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
        <button
          onClick={handleInitialState}
          className={twMerge(
            'w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white',
            !isData?.state.id && isData?.state.img === undefined && 'hidden'
          )}
        >
          Начальное состояние
        </button>

        <button
          onClick={handleClick}
          className="w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white"
        >
          Delete
        </button>
      </div>
    </>
  );
};
