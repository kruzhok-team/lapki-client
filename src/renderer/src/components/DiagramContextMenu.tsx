import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { useClickOutside } from '@renderer/hooks/useClickOutside';

import { Point } from '@renderer/types/graphics';
import { getVirtualElement } from '@renderer/utils';

import { ReactComponent as CopyIcon } from '@renderer/assets/icons/copy.svg';
import { ReactComponent as PasteIcon } from '@renderer/assets/icons/paste.svg';
import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as InitialIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state_add.svg';
import { ReactComponent as EventIcon } from '@renderer/assets/icons/event_add.svg';
import { ReactComponent as CameraIcon } from '@renderer/assets/icons/center_focus_2.svg';
import { ReactComponent as CodeAllIcon } from '@renderer/assets/icons/code_all_2.svg';
import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';

interface DiagramContextMenuProps {
  items: {
    label: string;
    type: string;
    isFolder?: boolean;
    children?: string[];
    action: () => void;
  }[];
  position: Point;

  isOpen: boolean;
  onClose: () => void;
}

export const DiagramContextMenu: React.FC<DiagramContextMenuProps> = (props) => {
  const { position, items, isOpen, onClose } = props;
  //Проверка на открытие дополнительных окон, пока реализовал таким методом, чтобы проверить и распределить данные как следует
  const [openMenu, setOpenMenu] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    elements: {
      reference: getVirtualElement(position),
    },
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });

  useClickOutside(refs.floating.current, onClose, !isOpen);

  const contextData = {
    copy: {
      icon: <CopyIcon />,
      combination: 'Ctrl+C',
    },
    paste: {
      icon: <PasteIcon />,
      combination: 'Ctrl+V',
    },
    pasteState: {
      icon: <StateIcon />,
      combination: undefined,
    },
    pasteEvent: {
      icon: <EventIcon />,
      combination: undefined,
    },
    initialState: {
      icon: <InitialIcon />,
      combination: undefined,
    },
    showCodeAll: {
      icon: <CodeAllIcon />,
      combination: undefined,
    },
    edit: {
      icon: <EditIcon />,
      combination: undefined,
    },
    centerCamera: {
      icon: <CameraIcon />,
      combination: undefined,
    },
    delete: {
      icon: <DeleteIcon />,
      combination: 'Del',
    },
  };
  console.log(position.x);
  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={twMerge('z-50 w-64 rounded bg-bg-secondary p-2 shadow-xl', !isOpen && 'hidden')}
    >
      {items.map(({ label, type, isFolder, children, action }, i) => (
        <>
          <button
            key={i}
            className={twMerge(
              'flex w-full justify-between rounded px-4 py-2 transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled',
              openMenu && isFolder && 'bg-bg-hover'
            )}
            onClick={() => {
              action();
              isFolder || onClose();
            }}
            onMouseMove={() => setOpenMenu(isOpen && isFolder && children ? true : false)}
          >
            <div className="flex">
              <div className="h-6 w-6">{contextData[type].icon}</div>
              <div className="pl-2">{label}</div>
            </div>
            <div className="flex">
              {contextData[type].combination}
              {isFolder && <div className="flex">{'>'}</div>}
            </div>
          </button>
          {isFolder && (
            //Крайняя мера, которую я не хотел добавлять сюда
            <div
              className={twMerge(
                'absolute top-[5.5rem] z-50 w-64 rounded bg-bg-secondary p-2 shadow-xl',
                !openMenu && 'hidden',
                position.x < 600 ? 'left-64' : 'left-[-16rem]'
              )}
            >
              {children}
            </div>
          )}
        </>
      ))}
    </div>
  );
};
