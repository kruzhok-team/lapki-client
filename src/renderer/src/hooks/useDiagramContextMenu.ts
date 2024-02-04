import { useEffect, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { State } from '@renderer/lib/drawable/State';
import { useTabs } from '@renderer/store/useTabs';
import { Point } from '@renderer/types/graphics';

export type DiagramContextMenuItem = {
  label: string;
  type: string;
  isFolder?: boolean;
  children?: DiagramContextMenuItem[];
  action: () => void;
};

export const useDiagramContextMenu = (editor: CanvasEditor | null, manager: EditorManager) => {
  const openTab = useTabs((state) => state.openTab);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<DiagramContextMenuItem[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const onClose = () => setIsOpen(false);

  useEffect(() => {
    if (!editor) return;

    const handleEvent = (pos: Point, items: DiagramContextMenuItem[]) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };

      setIsOpen(true);
      setPosition(position);
      setItems(items);
    };

    // контекстное меню для пустого поля
    editor.container.on('contextMenu', (pos) => {
      const canvasPos = editor.container.relativeMousePos(pos);

      handleEvent(pos, [
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.container.machineController.pasteSelected();
          },
        },
        {
          label: 'Вставить состояние',
          type: 'pasteState',
          action: () => {
            editor?.container.machineController.createState({
              name: 'Состояние',
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить записку',
          type: 'pasteState',
          action: () => {
            const note = editor?.container.machineController.createNote({
              position: canvasPos,
              placeInCenter: true,
              text: '',
            });

            editor.container.notesController.emit('change', note);
          },
        },
        {
          label: 'Посмотреть код',
          type: 'showCodeAll',
          action: () => {
            openTab({
              type: 'code',
              name: manager.data.name ?? 'Безымянная',
              code: manager.serializer.getAll('JSON'),
              language: 'json',
            });
          },
        },
        {
          label: 'Центрировать камеру',
          type: 'centerCamera',
          action: () => {
            editor?.container.viewCentering();
          },
        },
      ]);
    });

    // контекстное меню для состояния
    editor.container.statesController.on('stateContextMenu', ({ state, position }) => {
      const canvasPos = editor.container.relativeMousePos(position);

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            editor?.container.machineController.copySelected();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.container.machineController.pasteSelected();
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
                editor?.container.machineController.setInitialState(state.id);
              },
            },
            {
              label: 'Вставить состояние',
              type: 'pasteState',
              action: () => {
                editor?.container.machineController.createState({
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
              code: manager.serializer.getState(state.id) ?? '',
              language: 'json',
            });
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor?.container.machineController.deleteState(state.id as string);
          },
        },
      ]);
    });

    // контекстное меню для события
    editor.container.statesController.on('eventContextMenu', ({ state, position, event }) => {
      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor?.container.machineController.deleteEvent(state.id, event);
          },
        },
      ]);
    });

    // контекстное меню для связи
    editor.container.transitionsController.on(
      'transitionContextMenu',
      ({ transition, position }) => {
        const source = (state: State) => {
          return {
            label: state.eventBox.parent.data.name,
            type: 'source',
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            action: () => {
              editor?.container.machineController.changeTransition({
                id: transition.id,
                source: state.id,
                target: transition.data.target,
                color: transition.data.color,
                component: transition.data.trigger.component,
                method: transition.data.trigger.method,
                doAction: transition.data.do!,
                condition: transition.data.condition!,
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
              editor?.container.machineController.changeTransition({
                id: transition.id,
                source: transition.data.source,
                target: state.id,
                color: transition.data.color,
                component: transition.data.trigger.component,
                method: transition.data.trigger.method,
                doAction: transition.data.do!,
                condition: transition.data.condition!,
              });
            },
          };
        };

        const sourceArray = [
          ...Array.from(editor.container.machineController.states).filter(
            (value) => transition.data.source !== value[0]
          ),
        ];

        const targetArray = [
          ...Array.from(editor.container.machineController.states).filter(
            (value) => transition.data.target !== value[0]
          ),
        ];

        handleEvent(position, [
          {
            label: 'Копировать',
            type: 'copy',
            action: () => {
              editor?.container.machineController.copySelected();
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
                code: manager.serializer.getTransition(transition.id) ?? '',
                language: 'json',
              });
            },
          },
          {
            label: 'Удалить',
            type: 'delete',
            action: () => {
              editor?.container.machineController.deleteTransition(transition.id);
            },
          },
        ]);
      }
    );

    editor.container.notesController.on('contextMenu', ({ note, position }) => {
      handleEvent(position, [
        {
          label: 'Редактировать',
          type: 'edit',
          action: () => {
            editor.container.notesController.emit('change', note);
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            // editor?.container.machineController.deleteState(state.id as string);
          },
        },
      ]);
    });
  }, [editor]);

  return { isOpen, onClose, items, position };
};
