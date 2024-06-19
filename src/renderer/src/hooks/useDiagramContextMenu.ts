import { useEffect, useState } from 'react';

import {
  ChoiceState,
  EventSelection,
  FinalState,
  Note,
  State,
  Transition,
} from '@renderer/lib/drawable';
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
    const handleEvent = (pos: Point, items: DiagramContextMenuItem[]) => {
      setIsOpen(true);
      setPosition(pos);
      setItems(items);
    };

    const handleViewContextMenu = (position: Point) => {
      const mouseOffset = editor.view.app.mouse.getOffset();
      const canvasPos = editor.view.windowToWorldCoords({
        x: position.x - mouseOffset.x,
        y: position.y - mouseOffset.y,
      });

      handleEvent(position, [
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.controller.pasteSelected();
            editor.mouse.element.focus();
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
            });
            editor.mouse.element.focus();
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
            editor.mouse.element.focus();
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
            editor.mouse.element.focus();
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
            editor.mouse.element.focus();
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
            editor.mouse.element.focus();
          },
        },
        {
          label: 'Центрировать камеру',
          type: 'centerCamera',
          action: () => {
            editor?.view.viewCentering();
            editor.mouse.element.focus();
          },
        },
      ]);
    };
    const handleStateContextMenu = (data: { state: State; position: Point }) => {
      const { state, position } = data;

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            editor?.controller.copySelected();
            editor.mouse.element.focus();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            editor?.controller.pasteSelected();
            editor.mouse.element.focus();
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
                editor.mouse.element.focus();
              },
            },
            {
              label: 'Вставить состояние',
              type: 'pasteState',
              action: () => {
                editor.controller.states.createState({
                  name: 'Состояние',
                  position: editor.view.windowToWorldCoords(position),
                  parentId: state.id,
                });
                editor.mouse.element.focus();
              },
            },
          ],
          action: () => {
            editor.mouse.element.focus();
          },
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
            editor.mouse.element.focus();
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteState(state.id);
            editor.mouse.element.focus();
          },
        },
      ]);
    };
    const handleFinalStateContextMenu = (data: { state: FinalState; position: Point }) => {
      const { state, position } = data;

      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteFinalState(state.id);
            editor.mouse.element.focus();
          },
        },
      ]);
    };
    const handleChoiceStateContextMenu = (data: { state: ChoiceState; position: Point }) => {
      const { state, position } = data;

      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteChoiceState(state.id);
            editor.mouse.element.focus();
          },
        },
      ]);
    };
    const handleEventContextMenu = (data: {
      state: State;
      position: Point;
      event: EventSelection;
    }) => {
      const { state, position, event } = data;
      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.states.deleteEvent(state.id, event);
            editor.mouse.element.focus();
          },
        },
      ]);
    };
    const handleTransitionContextMenu = (data: { transition: Transition; position: Point }) => {
      const { transition, position } = data;

      const source = (state: State) => {
        return {
          label: state.eventBox.parent.data.name,
          type: 'source',
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: () => {
            editor.controller.transitions.changeTransition({
              ...transition.data,
              id: transition.id,
              sourceId: state.id,
            });
            editor.mouse.element.focus();
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
              targetId: state.id,
            });
            editor.mouse.element.focus();
          },
        };
      };

      const sourceArray = [
        ...Array.from(editor.controller.states.getStates()).filter(
          (value) => transition.data.sourceId !== value[0]
        ),
      ];

      const targetArray = [
        ...Array.from(editor.controller.states.getStates()).filter(
          (value) => transition.data.targetId !== value[0]
        ),
      ];

      handleEvent(position, [
        ...(transition.data.label
          ? [
              {
                label: 'Копировать',
                type: 'copy',
                action: () => {
                  editor?.controller.copySelected();
                  editor.mouse.element.focus();
                },
              },
              {
                label: 'Выбрать исход(source)',
                type: 'source',
                isFolder: true,
                children: [...sourceArray.map(([_id, value]) => source(value))],
                action: () => {
                  editor.mouse.element.focus();
                },
              },
              {
                label: 'Выбрать цель(target)',
                type: 'target',
                isFolder: true,
                children: [...targetArray.map(([_id, value]) => target(value))],
                action: () => {
                  editor.mouse.element.focus();
                },
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
                  editor.mouse.element.focus();
                },
              },
            ]
          : []),
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor.controller.transitions.deleteTransition(transition.id);
            editor.mouse.element.focus();
          },
        },
      ]);
    };
    const handleNoteContextMenu = (data: { note: Note; position: Point }) => {
      const { note, position } = data;

      handleEvent(position, [
        {
          label: 'Редактировать',
          type: 'edit',
          action: () => {
            editor.controller.notes.emit('change', note);
            editor.mouse.element.focus();
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor?.controller.notes.deleteNote(note.id);
            editor.mouse.element.focus();
          },
        },
      ]);
    };

    // контекстное меню для пустого поля
    editor.view.on('contextMenu', handleViewContextMenu);
    // контекстное меню для состояний
    editor.controller.states.on('stateContextMenu', handleStateContextMenu);
    editor.controller.states.on('finalStateContextMenu', handleFinalStateContextMenu);
    editor.controller.states.on('choiceStateContextMenu', handleChoiceStateContextMenu);
    // контекстное меню для события
    editor.controller.states.on('eventContextMenu', handleEventContextMenu);
    // контекстное меню для связи
    editor.controller.transitions.on('transitionContextMenu', handleTransitionContextMenu);
    editor.controller.notes.on('contextMenu', handleNoteContextMenu);

    //! Не забывать удалять слушатели
    return () => {
      editor.view.off('contextMenu', handleViewContextMenu);
      editor.controller.states.off('stateContextMenu', handleStateContextMenu);
      editor.controller.states.off('finalStateContextMenu', handleFinalStateContextMenu);
      editor.controller.states.off('choiceStateContextMenu', handleChoiceStateContextMenu);
      editor.controller.states.off('eventContextMenu', handleEventContextMenu);
      editor.controller.transitions.off('transitionContextMenu', handleTransitionContextMenu);
      editor.controller.notes.off('contextMenu', handleNoteContextMenu);
    };
  }, [editor, openTab]);

  return { isOpen, onClose, items, position };
};
