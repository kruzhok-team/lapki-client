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

  const handleDeleteClick = hookHandleSubmit((data) => {
    //отсылаем id ноды для удаления состояния
    data.id = isData?.state.id;
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

  //Рисуем виртуальный объект
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

  //Массив кнопок
  const button = [
    {
      text: 'Назначить начальным',
      onClick: handleInitialState,
      style:
        (!isData?.state.isState || isData?.state.isInitial === true || !isData?.state.id) &&
        'hidden',
    },
    {
      text: 'Посмотреть код',
      onClick: handleInitialState,
    },
    {
      text: 'Удалить',
      onClick: handleDeleteClick,
    },
  ];

  return (
    <>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        key="ContextMenu"
        className={twMerge(
          'font z-50 w-56 rounded-lg bg-neutral-100 p-2 font-Fira text-base',
          !isOpen && 'hidden'
        )}
      >
        {button.map(({ text, onClick, style }, i) => (
          <button
            onClick={onClick}
            key={'ContextMenu' + i}
            className={twMerge(
              'w-full px-4 py-2 transition-colors hover:bg-red-600 hover:text-white',
              style
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </>
  );
};
