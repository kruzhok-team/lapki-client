import { useEffect, useState } from 'react';

import { DEFAULT_STATE_COLOR } from '@renderer/lib/constants';
import { State } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useTabs } from '@renderer/store/useTabs';

export type DiagramContextMenuItem = {
  label: string;
  type: string;
  isFolder?: boolean;
  children?: DiagramContextMenuItem[];
  action: () => void;
};

export const useDiagramContextMenu = () => {
  const editor = useEditorContext();

  const openTab = useTabs((state) => state.openTab);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<DiagramContextMenuItem[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const onClose = () => setIsOpen(false);

  useEffect(() => {
    if (!editor) return;

    const handleEvent = (pos: Point, items: DiagramContextMenuItem[]) => {
      setIsOpen(true);
      setPosition(pos);
      setItems(items);
    };

    // контекстное меню для пустого поля
    editor.view.on('contextMenu', (position) => {
      const mouseOffset = editor.view.app.mouse.getOffset();
      const canvasPos = editor.view.relativeMousePos({
        x: position.x - mouseOffset.x,
        y: position.y - mouseOffset.y,
      });

      handleEvent(position, [
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.controller.pasteSelected();
          },
        },
        {
          label: 'Вставить состояние',
          type: 'pasteState',
          action: () => {
            editor.controller.states.createState({
              name: 'Состояние',
              position: canvasPos,
              placeInCenter: true,
              color: DEFAULT_STATE_COLOR,
            });
          },
        },
        {
          label: 'Вставить конечное состояние',
          type: 'pasteFinalState',
          action: () => {
            editor.controller.states.createFinalState({
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить состояние выбора',
          type: 'pasteChoiceState',
          action: () => {
            editor.controller.states.createChoiceState({
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить заметку',
          type: 'note',
          action: () => {
            const note = editor.controller.notes.createNote({
              position: canvasPos,
              placeInCenter: true,
              text: '',
            });

            editor.controller.notes.emit('change', note);
          },
        },
        {
          label: 'Посмотреть код',
          type: 'showCodeAll',
          action: () => {
            openTab({
              type: 'code',
              name: editor.model.data.name ?? 'Безымянная',
              code: editor.model.serializer.getAll('JSON'),
              language: 'json',
            });
          },
        },
        {
          label: 'Центрировать камеру',
          type: 'centerCamera',
          action: () => {
            editor?.view.viewCentering();
          },
        },
      ]);
    });

    // контекстное меню для состояния
    editor.controller.states.on('stateContextMenu', ({ state, position }) => {
      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            editor?.controller.copySelected();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.controller.pasteSelected();
          },
        },
        {
          label: 'Редактировать',
          type: 'edit',
          isFolder: true,
          children: [
            {
              label: 'Назначить начальным',
              type: 'initialState',
              action: () => {
                editor.controller.states.setInitialState(state.id);
              },
            },
            {
              label: 'Вставить состояние',
              type: 'pasteState',
              action: () => {
                editor.controller.states.createState({
                  name: 'Состояние',
                  position: editor.view.relativeMousePos(position),
                  parentId: state.id,
                  color: DEFAULT_STATE_COLOR,
                });
              },
            },
          ],
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: () => {},
        },
        {
          label: 'Посмотреть код',
          type: 'showCodeAll',
          action: () => {
            openTab({
              type: 'state',
              name: state.data.name,
              code: editor.model.serializer.getState(state.id) ?? '',
              language: 'json',
            });
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteState(state.id);
          },
        },
      ]);
    });

    editor.controller.states.on('finalStateContextMenu', ({ state, position }) => {
      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteFinalState(state.id);
          },
        },
      ]);
    });

    editor.controller.states.on('choiceStateContextMenu', ({ state, position }) => {
      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteChoiceState(state.id);
          },
        },
      ]);
    });

    // контекстное меню для события
    editor.controller.states.on('eventContextMenu', ({ state, position, event }) => {
      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteEvent(state.id, event);
          },
        },
      ]);
    });

    // контекстное меню для связи
    editor.controller.transitions.on('transitionContextMenu', ({ transition, position }) => {
      const source = (state: State) => {
        return {
          label: state.eventBox.parent.data.name,
          type: 'source',
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: () => {
            editor.controller.transitions.changeTransition({
              ...transition.data,
              id: transition.id,
              source: state.id,
            });
          },
        };
      };

      const target = (state: State) => {
        return {
          label: state.eventBox.parent.data.name,
          type: 'target',
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: () => {
            editor.controller.transitions.changeTransition({
              ...transition.data,
              id: transition.id,
              target: state.id,
            });
          },
        };
      };

      const sourceArray = [
        ...Array.from(editor.controller.states.getStates()).filter(
          (value) => transition.data.source !== value[0]
        ),
      ];

      const targetArray = [
        ...Array.from(editor.controller.states.getStates()).filter(
          (value) => transition.data.target !== value[0]
        ),
      ];

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            editor?.controller.copySelected();
          },
        },
        {
          label: 'Выбрать исход(source)',
          type: 'source',
          isFolder: true,
          children: [...sourceArray.map(([_id, value]) => source(value))],
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: () => {},
        },
        {
          label: 'Выбрать цель(target)',
          type: 'target',
          isFolder: true,
          children: [...targetArray.map(([_id, value]) => target(value))],
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: () => {},
        },
        {
          label: 'Посмотреть код',
          type: 'showCodeAll',
          action: () => {
            openTab({
              type: 'transition',
              name: transition.id,
              code: editor.model.serializer.getTransition(transition.id) ?? '',
              language: 'json',
            });
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.transitions.deleteTransition(transition.id);
          },
        },
      ]);
    });

    editor.controller.notes.on('contextMenu', ({ note, position }) => {
      handleEvent(position, [
        {
          label: 'Редактировать',
          type: 'edit',
          action: () => {
            editor.controller.notes.emit('change', note);
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor?.controller.notes.deleteNote(note.id);
          },
        },
      ]);
    });
  }, [editor, openTab]);

  return { isOpen, onClose, items, position };
};
