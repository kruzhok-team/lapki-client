import { useEffect, useState } from 'react';

import { EventSelection, State } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';

export type DiagramContextMenuItem = {
  label: string;
  type: string;
  isFolder?: boolean;
  children?: DiagramContextMenuItem[];
  action: () => void;
};

export const useDiagramContextMenu = () => {
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();
  const name = modelController.model.useData('', 'name') as string | null;
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const currentSm = stateMachines[0];
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

    const handleViewEditorContextMenu = (position: Point) => {
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
            modelController.pasteSelected();
          },
        },
        {
          label: 'Вставить состояние',
          type: 'pasteState',
          action: () => {
            modelController.createState({
              smId: currentSm,
              events: [],
              dimensions: { width: 100, height: 50 }, // TODO (L140-beep): уточнить
              name: 'Состояние',
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить конечное состояние',
          type: 'pasteFinalState',
          action: () => {
            modelController.createFinalState({
              smId: currentSm,
              dimensions: { width: 100, height: 50 },
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить состояние выбора',
          type: 'pasteChoiceState',
          action: () => {
            modelController.createChoiceState({
              smId: currentSm,
              dimensions: { width: 100, height: 50 },
              position: canvasPos,
              placeInCenter: true,
            });
          },
        },
        {
          label: 'Вставить заметку',
          type: 'note',
          action: () => {
            modelController.createNote({
              smId: currentSm,
              position: canvasPos,
              placeInCenter: true,
              text: '',
            });

            // editor.controller.notes.emit('change', note);
          },
        },
        {
          label: 'Посмотреть код',
          type: 'showCodeAll',
          action: () => {
            openTab({
              type: 'code',
              name: name ?? 'Безымянная',
              code: modelController.model.serializer.getAll('JSON'),
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
    };

    const handleStateContextMenu = (data: { state: State; position: Point }) => {
      const { state, position } = data;

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            modelController.copySelected();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            modelController.pasteSelected();
          },
        },
        {
          label: 'Дублировать',
          type: 'clone',
          action: () => {
            modelController.duplicateSelected();
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
                modelController.setInitialState(currentSm, state.id);
              },
            },
            {
              label: 'Вставить состояние',
              type: 'pasteState',
              action: () => {
                modelController.createState({
                  smId: currentSm,
                  dimensions: { width: 100, height: 50 },
                  events: [],
                  name: 'Состояние',
                  position: editor.view.windowToWorldCoords(position),
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
              code: modelController.model.serializer.getState(currentSm, state.id) ?? '',
              language: 'json',
            });
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            modelController.deleteState({ smId: currentSm, id: state.id });
          },
        },
      ]);
    };
    const handleFinalStateContextMenu = (data: { stateId: string; position: Point }) => {
      const { stateId, position } = data;

      handleEvent(position, [
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            modelController.deleteFinalState({ smId: currentSm, id: stateId });
          },
        },
      ]);
    };
    const handleChoiceStateContextMenu = (data: { stateId: string; position: Point }) => {
      const { stateId, position } = data;

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            modelController.copySelected();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            modelController.pasteSelected();
          },
        },
        {
          label: 'Дублировать',
          type: 'clone',
          action: () => {
            modelController.duplicateSelected();
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            modelController.deleteChoiceState({ smId: currentSm, id: stateId });
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
            modelController.deleteEvent({
              smId: currentSm,
              stateId: state.id,
              event: event,
            });
          },
        },
      ]);
    };
    const handleTransitionContextMenu = (data: { transitionId: string; position: Point }) => {
      const { transitionId, position } = data;
      const transitionData =
        modelController.model.data.elements.stateMachines[currentSm].transitions[transitionId];
      const source = (state: State) => {
        return {
          label: state.eventBox.parent.data.name,
          type: 'source',
          action: () => {
            modelController.changeTransition({
              ...transitionData,
              smId: currentSm,
              id: transitionId,
              sourceId: state.id,
            });
          },
        };
      };

      const target = (state: State) => {
        return {
          label: state.eventBox.parent.data.name,
          type: 'target',
          action: () => {
            modelController.changeTransition({
              ...transitionData,
              smId: currentSm,
              id: transitionId,
              targetId: state.id,
            });
          },
        };
      };

      const sourceArray = [
        ...Array.from(editor.controller.states.getStates()).filter(
          (value) => transitionData.sourceId !== value[0]
        ),
      ];

      const targetArray = [
        ...Array.from(editor.controller.states.getStates()).filter(
          (value) => transitionData.targetId !== value[0]
        ),
      ];

      handleEvent(position, [
        ...(transitionData.label
          ? [
              {
                label: 'Копировать',
                type: 'copy',
                action: () => {
                  modelController.copySelected();
                },
              },
              {
                label: 'Дублировать',
                type: 'clone',
                action: () => {
                  modelController.duplicateSelected();
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
                    name: transitionId,
                    code:
                      modelController.model.serializer.getTransition(currentSm, transitionId) ?? '',
                    language: 'json',
                  });
                },
              },
            ]
          : []),
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            modelController.deleteTransition({
              smId: currentSm,
              id: transitionId,
            });
          },
        },
      ]);
    };
    const handleNoteContextMenu = (data: { noteId: string; position: Point }) => {
      const { noteId, position } = data;

      handleEvent(position, [
        {
          label: 'Копировать',
          type: 'copy',
          action: () => {
            modelController.copySelected();
          },
        },
        {
          label: 'Вставить',
          type: 'paste',
          action: () => {
            modelController.pasteSelected();
          },
        },
        {
          label: 'Дублировать',
          type: 'clone',
          action: () => {
            modelController.duplicateSelected();
          },
        },
        {
          label: 'Редактировать',
          type: 'edit',
          action: () => {
            // TODO (L140-beep): А работает ли?
            const note = editor.controller.notes.items.get(noteId);
            if (note) editor.controller.notes.emit('change', note);
          },
        },
        {
          label: 'Удалить',
          type: 'delete',
          action: () => {
            editor?.controller.notes.deleteNote({
              smId: currentSm,
              id: noteId,
            });
          },
        },
      ]);
    };

    // контекстное меню для пустого поля редактора
    editor.view.on('contextMenu', handleViewEditorContextMenu);
    // контекстное меню для состояний
    editor.controller.states.on('stateContextMenu', handleStateContextMenu);
    editor.controller.states.on('finalStateContextMenu', handleFinalStateContextMenu);
    editor.controller.states.on('choiceStateContextMenu', handleChoiceStateContextMenu);
    // контекстное меню для события
    editor.controller.states.on('eventContextMenu', handleEventContextMenu);
    // контекстное меню для связи
    editor.controller.transitions.on('transitionContextMenu', handleTransitionContextMenu);
    editor.controller.notes.on('contextMenu', handleNoteContextMenu);

    // контекстное меню для компонентов
    //screen.controller.components.on('contextMenu', handleComponentContextMenu);
    //! Не забывать удалять слушатели
    return () => {
      editor.view.off('contextMenu', handleViewEditorContextMenu);
      editor.controller.states.off('stateContextMenu', handleStateContextMenu);
      editor.controller.states.off('finalStateContextMenu', handleFinalStateContextMenu);
      editor.controller.states.off('choiceStateContextMenu', handleChoiceStateContextMenu);
      editor.controller.states.off('eventContextMenu', handleEventContextMenu);
      editor.controller.transitions.off('transitionContextMenu', handleTransitionContextMenu);
      editor.controller.notes.off('contextMenu', handleNoteContextMenu);
      //screen.controller.components.on('contextMenu', handleComponentContextMenu);
    };
  }, [editor, openTab]);

  return { isOpen, onClose, items, position };
};
