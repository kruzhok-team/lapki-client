import { useEffect } from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Condition } from '@renderer/lib/drawable/Condition';
import { EventSelection } from '@renderer/lib/drawable/Events';
import { State } from '@renderer/lib/drawable/State';
import { Point } from '@renderer/types/graphics';

export interface StateContextMenuData {
  data: State | Condition | null;
  canvasPos: Point;
  position: Point;
  event: EventSelection | undefined;
}

export interface StateContextMenuCallbacks {
  onClickNewState: (pos: Point) => void;
  onClickDelState: (data: ContextMenuForm) => void;
  onClickInitial: (data: ContextMenuForm) => void;
  onClickDelTran: (data: ContextMenuForm) => void;
  onClickDelEvent: (data: ContextMenuForm) => void;
  onClickShowCode: (data: ContextMenuForm) => void;
  onCloseMe: () => void;
  onViewCentering: () => void;
}

interface StateContextMenuProps {
  isOpen: boolean;
  isData: StateContextMenuData | undefined;
  callbacks: StateContextMenuCallbacks;
}

export interface ContextMenuForm {
  name: string;
  type: string;
  eventId: EventSelection;
  content: string;
}

export const StateContextMenu: React.FC<StateContextMenuProps> = ({
  isOpen,
  isData,
  callbacks: {
    onClickNewState,
    onClickInitial,
    onClickDelState,
    onClickDelTran,
    onClickDelEvent,
    onClickShowCode,
    onCloseMe,
    onViewCentering,
  },
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm<ContextMenuForm>();

  const handleNewState = hookHandleSubmit((_data) => {
    onCloseMe();
    if (typeof isData?.canvasPos === 'undefined') return;
    onClickNewState(isData.canvasPos);
  });

  const handleDeleteClick = hookHandleSubmit((data) => {
    onCloseMe();
    if (typeof isData === 'undefined') return; // удалять нечего

    if (isData!.data instanceof Condition) {
      data.name = isData?.data.id!;
      onClickDelTran(data);
    }
    if (isData!.data instanceof State) {
      data.name = isData?.data.id!;
      if (!isData!.event) {
        onClickDelState(data);
      } else {
        data.eventId = isData?.event;
        onClickDelEvent(data);
      }
    }
  });

  //отсылаем данные ноды для показа его кода
  const handleShowCode = hookHandleSubmit((data) => {
    console.log(['handleShowCode', isData]);
    if (typeof isData === 'undefined') return; // удалять нечего

    if (isData!.data === null) {
      onCloseMe();
      data.type = 'code';
      data.name = 'FullCode';
      onClickShowCode(data);
    }

    if (isData!.data instanceof Condition) {
      onCloseMe();
      data.type = 'transition';
      data.name = isData?.data.transition.id!;
      data.content = JSON.stringify(isData.data, null, 2);
      onClickShowCode(data);
    }

    if (isData!.data instanceof State) {
      onCloseMe();
      data.type = 'state';
      data.name = isData?.data.id!;
      data.content = JSON.stringify(isData.data, null, 2);
      onClickShowCode(data);
    }
  });

  //отсылаем id ноды для изменения начального состояния
  const handleInitialState = hookHandleSubmit((data) => {
    onCloseMe();
    if (typeof isData === 'undefined') return; // удалять нечего
    if (!(isData!.data instanceof State)) return; // не нода
    data.name = isData?.data.id!;
    onClickInitial(data);
  });

  //Рисуем виртуальный объект
  const position = isData?.position ?? { x: 0, y: 0 };
  const x = position.x;
  const y = position.y;

  const virtualEl = {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
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
      text: 'Вставить состояние',
      onClick: handleNewState,
      style: (isData?.data instanceof Condition || isData?.event) && 'hidden',
    },
    {
      text: 'Назначить начальным',
      onClick: handleInitialState,
      style: !(isData?.data instanceof State && isData?.event === undefined) && 'hidden',
      disabled:
        !(isData?.data instanceof State) || isData?.data.isInitial === true || !isData?.data.id,
    },
    {
      text: 'Посмотреть код',
      onClick: handleShowCode,
      style: !(isData?.event === undefined) && 'hidden',
    },
    {
      text: 'Удалить',
      onClick: handleDeleteClick,
      style: !isData?.data && 'hidden',
    },
    {
      text: 'Центрировать камеру',
      onClick: onViewCentering,
      style: !(isData?.event === undefined) && 'hidden',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;

      const ref = refs.floating;

      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onCloseMe();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, refs.floating, onCloseMe]);

  return (
    <>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={twMerge('z-50 w-56 rounded bg-bg-secondary p-2 shadow-xl', !isOpen && 'hidden')}
      >
        {button.map(({ text, onClick, style, disabled }, i) => (
          <button
            onClick={onClick}
            key={'ContextMenu' + i}
            disabled={disabled}
            className={twMerge(
              'w-full rounded px-4 py-2 transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled',
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
