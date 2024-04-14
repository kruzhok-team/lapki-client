import { useEffect, useState } from 'react';

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
    editor.editorView.on('contextMenu', (pos) => {
      const canvasPos = editor.editorView.relativeMousePos(pos);

      handleEvent(pos, [
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.editorView.editorController.pasteSelected();
          },
        },
        {
          label: 'Вставить состояние',
          type: 'pasteState',
          action: () => {
            editor.editorView.editorController.states.createState({
              name: 'Состояние',
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить заметку',
          type: 'note',
          action: () => {
            const note = editor.editorView.editorController.notes.createNote({
              position: canvasPos,
              placeInCenter: true,
              text: '',
            });

            editor.editorView.editorController.notes.emit('change', note);
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
            editor?.editorView.viewCentering();
          },
        },
      ]);
    });

    // контекстное меню для состояния
    editor.editorView.editorController.states.on('stateContextMenu', ({ state, position }) => {
      const canvasPos = editor.editorView.relativeMousePos(position);

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            editor?.editorView.editorController.copySelected();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.editorView.editorController.pasteSelected();
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
                // editor?.editorView.editorController.setInitialState(state.id);
              },
            },
            {
              label: 'Вставить состояние',
              type: 'pasteState',
              action: () => {
                editor.editorView.editorController.states.createState({
                  name: 'Состояние',
                  position: canvasPos,
                  parentId: state.id,
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
            editor.editorView.editorController.states.deleteState(state.id as string);
          },
        },
      ]);
    });

    // контекстное меню для события
    editor.editorView.editorController.states.on(
      'eventContextMenu',
      ({ state, position, event }) => {
        handleEvent(position, [
          {
            label: 'Удалить',
            type: 'delete',
            action: () => {
              editor.editorView.editorController.states.deleteEvent(state.id, event);
            },
          },
        ]);
      }
    );

    // контекстное меню для связи
    editor.editorView.editorController.transitions.on(
      'transitionContextMenu',
      ({ transition, position }) => {
        const source = (state: State) => {
          return {
            label: state.eventBox.parent.data.name,
            type: 'source',
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            action: () => {
              editor.editorView.editorController.transitions.changeTransition({
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
              editor.editorView.editorController.transitions.changeTransition({
                ...transition.data,
                id: transition.id,
                target: state.id,
              });
            },
          };
        };

        const sourceArray = [
          ...Array.from(editor.editorView.editorController.states.getStates()).filter(
            (value) => transition.data.source !== value[0]
          ),
        ];

        const targetArray = [
          ...Array.from(editor.editorView.editorController.states.getStates()).filter(
            (value) => transition.data.target !== value[0]
          ),
        ];

        handleEvent(position, [
          {
            label: 'Копировать',
            type: 'copy',
            action: () => {
              editor?.editorView.editorController.copySelected();
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
              editor.editorView.editorController.transitions.deleteTransition(transition.id);
            },
          },
        ]);
      }
    );

    editor.editorView.editorController.notes.on('contextMenu', ({ note, position }) => {
      handleEvent(position, [
        {
          label: 'Редактировать',
          type: 'edit',
          action: () => {
            editor.editorView.editorController.notes.emit('change', note);
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor?.editorView.editorController.notes.deleteNote(note.id);
          },
        },
      ]);
    });
  }, [editor]);

  return { isOpen, onClose, items, position };
};
