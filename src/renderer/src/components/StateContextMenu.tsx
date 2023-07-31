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
    //отсылаем id ноды для удаления состояния
    data.id = isData?.state.id;
    console.log(isData?.state.isInitial);
    onClickDelState(data);

    //отсылаем bounds для удаления связи
    data.id = isData?.state.bounds;
    onClickDelTran(data);
  });

  //отсылаем id ноды для изменения начального состояния
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
        className={twMerge('z-50 w-52 rounded-lg bg-neutral-100 p-2', !isOpen && 'hidden')}
      >
        <button
          onClick={handleInitialState}
          className={twMerge(
            'w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white',
            (isData?.state.isInitial === true || !isData?.state.id) && 'hidden'
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
