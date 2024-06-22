import React, { Fragment, useLayoutEffect, useState } from 'react';

import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as InitialIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as CameraIcon } from '@renderer/assets/icons/center_focus_2.svg';
import { ReactComponent as ChoiceStateIcon } from '@renderer/assets/icons/choice_state.svg';
import { ReactComponent as CodeAllIcon } from '@renderer/assets/icons/code_all_2.svg';
import { ReactComponent as CopyIcon } from '@renderer/assets/icons/copy.svg';
import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';
import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as EventIcon } from '@renderer/assets/icons/event_add.svg';
import { ReactComponent as FinalStateIcon } from '@renderer/assets/icons/final_state.svg';
import { ReactComponent as NoteIcon } from '@renderer/assets/icons/note.svg';
import { ReactComponent as PasteIcon } from '@renderer/assets/icons/paste.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state_add.svg';
import { useClickOutside } from '@renderer/hooks/useClickOutside';
import { useDiagramContextMenu } from '@renderer/hooks/useDiagramContextMenu';
import { useEditorContext } from '@renderer/store/EditorContext';
import { getVirtualElement } from '@renderer/utils';

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
  pasteFinalState: {
    icon: <FinalStateIcon className="h-full w-full" />,
    combination: undefined,
  },
  pasteChoiceState: {
    icon: <ChoiceStateIcon className="h-full w-full" />,
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
  source: {
    icon: undefined,
    combination: undefined,
  },
  target: {
    icon: undefined,
    combination: undefined,
  },
  note: {
    icon: <NoteIcon />,
    combination: undefined,
  },
};

export const DiagramContextMenu: React.FC = () => {
  const editor = useEditorContext();

  const { position, items, isOpen, onClose } = useDiagramContextMenu();
  //Проверка на открытие дополнительных окон, пока реализовал таким методом, чтобы проверить и распределить данные как следует
  const [openMenu, setOpenMenu] = useState('');

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });

  useClickOutside(refs.floating.current, onClose, !isOpen);

  // TODO(bryzZz) Два эффекта просто на синхронизацию разных состояний, нужно переделать на один источник истины
  useLayoutEffect(() => {
    refs.setPositionReference(getVirtualElement(position));
  }, [position, refs]);

  useLayoutEffect(() => {
    setOpenMenu('');
  }, [isOpen]);

  const handleFocusClose = () => {
    editor.focus();
    onClose();
  };

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={twMerge('z-50 w-80 rounded bg-bg-secondary p-2 shadow-xl', !isOpen && 'hidden')}
    >
      {items.map(({ label, type, isFolder, children, action }, i) => (
        <Fragment key={i}>
          <button
            className={twMerge(
              'flex w-full justify-between rounded px-4 py-2 transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled',
              openMenu === type && isFolder && 'bg-bg-hover'
            )}
            onClick={() => {
              action();
              isFolder || handleFocusClose();
            }}
            onMouseOver={() => {
              openMenu !== type && setOpenMenu(type);
            }}
          >
            <div className="flex">
              <div className={twMerge('h-6 w-6', contextData[type].icon === undefined && 'hidden')}>
                {contextData[type].icon}
              </div>
              <div className="pl-2">{label}</div>
            </div>
            <div className="flex">
              {contextData[type].combination}
              {isFolder && <div className="flex">{'>'}</div>}
            </div>
          </button>
          {openMenu === type && isFolder && (
            //Крайняя мера, которую я не хотел добавлять сюда, я про стили и про дублирующий код
            <div
              className={twMerge(
                `absolute z-50 w-64 overflow-y-auto rounded bg-bg-secondary p-2 shadow-xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current`,
                !openMenu && 'hidden',
                position.x < 800 ? 'left-64' : 'left-[-16rem]'
              )}
              style={{ top: `calc(${i}*2.75rem)` }}
            >
              {children &&
                children.map(({ label, action }, i) => (
                  <button
                    key={i}
                    className={twMerge(
                      'flex w-full justify-between rounded px-4 py-2 transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled'
                    )}
                    onClick={() => {
                      action();
                      handleFocusClose();
                    }}
                  >
                    <div className="flex">
                      <div className="pl-2">{label}</div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
};
