import React, { useLayoutEffect, useState } from 'react';

import { ReactComponent as CheckIcon } from '@renderer/assets/icons/check.svg';
import { ReactComponent as CloneIcon } from '@renderer/assets/icons/clone.svg';
import { ReactComponent as CopyIcon } from '@renderer/assets/icons/copy.svg';
import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';
import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as FontSizeIcon } from '@renderer/assets/icons/font_size.svg';
import { ReactComponent as PasteIcon } from '@renderer/assets/icons/paste.svg';
import { ColorInput } from '@renderer/components/UI';
import { Note } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';

import { ContextMenu, MenuItem, SubMenu, SubMenuContainer } from '../ContextMenu';

interface NoteMenuProps {
  position: Point;
  note: Note;
  onClose: () => void;
}

const fontSizes = [12, 14, 16, 18, 20, 22];

export const NoteMenu: React.FC<NoteMenuProps> = ({ onClose, note, position }) => {
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const smId = stateMachines[0];

  const [bgColor, setBgColor] = useState<string | undefined>(undefined);
  const [textColor, setTextColor] = useState<string | undefined>(undefined);

  const handleBgColorPickerClose = () => {
    if (note.data?.backgroundColor !== bgColor) {
      modelController.changeNoteBackgroundColor({ smId, id: note.id, backgroundColor: bgColor });
    }
  };

  const handleTextColorPickerClose = () => {
    if (note.data?.textColor !== textColor) {
      modelController.changeNoteTextColor({ smId, id: note.id, textColor });
    }
  };

  // Выставление начальных данных
  useLayoutEffect(() => {
    setBgColor(note.data?.backgroundColor);
    setTextColor(note.data?.textColor);
  }, [note.data?.backgroundColor, note.data?.textColor]);

  return (
    <ContextMenu onClose={onClose}>
      <MenuItem onClick={() => editor.controller.notes.emit('change', note)}>
        <EditIcon className="size-6 flex-shrink-0" /> Редактировать
      </MenuItem>
      <MenuItem onClick={() => modelController.copySelected()}>
        <CopyIcon className="size-6 flex-shrink-0" /> Копировать
        <span className="ml-auto">Ctrl+C</span>
      </MenuItem>

      <MenuItem onClick={() => modelController.pasteSelected()}>
        <PasteIcon className="size-6 flex-shrink-0" /> Вставить
        <span className="ml-auto">Ctrl+V</span>
      </MenuItem>

      <MenuItem onClick={() => modelController.duplicateSelected()}>
        <CloneIcon className="size-6 flex-shrink-0" /> Дублировать
        <span className="ml-auto">Ctrl+D</span>
      </MenuItem>
      <MenuItem className="relative justify-between" closeable={false}>
        Цвет фона
        <ColorInput
          clearable
          value={bgColor}
          onChange={setBgColor}
          onClose={handleBgColorPickerClose}
        />
      </MenuItem>
      <MenuItem className="relative justify-between" closeable={false}>
        Цвет текста
        <ColorInput
          clearable
          value={textColor}
          onChange={setTextColor}
          onClose={handleTextColorPickerClose}
        />
      </MenuItem>
      <SubMenuContainer>
        <MenuItem>
          <FontSizeIcon className="size-6 flex-shrink-0" />
          Размер шрифта
        </MenuItem>

        <SubMenu className="w-28 justify-between" position={position.x < 800 ? 'left' : 'right'}>
          {fontSizes.map((size) => (
            <MenuItem
              key={size}
              onClick={() =>
                modelController.changeNoteFontSize({ smId, id: note.id, fontSize: size })
              }
            >
              {size}px
              {(note.data?.fontSize ?? 16) === size && (
                <CheckIcon className="size-6 flex-shrink-0" />
              )}
            </MenuItem>
          ))}
        </SubMenu>
      </SubMenuContainer>
      <MenuItem
        className="enabled:hover:bg-error"
        onClick={() => modelController.deleteNote({ smId, id: note.id })}
      >
        <DeleteIcon className="size-6 flex-shrink-0" /> Удалить
        <span className="ml-auto">Del</span>
      </MenuItem>
    </ContextMenu>
  );
};
