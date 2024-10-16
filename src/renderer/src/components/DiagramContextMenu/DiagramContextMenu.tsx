import React, { useEffect, useMemo, useState } from 'react';

import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as InitialIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as CameraIcon } from '@renderer/assets/icons/center_focus_2.svg';
import { ReactComponent as ChoiceStateIcon } from '@renderer/assets/icons/choice_state.svg';
import { ReactComponent as CodeAllIcon } from '@renderer/assets/icons/code_all_2.svg';
import { ReactComponent as CopyIcon } from '@renderer/assets/icons/copy.svg';
import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';
import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as FinalStateIcon } from '@renderer/assets/icons/final_state.svg';
import { ReactComponent as NoteIcon } from '@renderer/assets/icons/note.svg';
import { ReactComponent as PasteIcon } from '@renderer/assets/icons/paste.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state_add.svg';
import { useModal } from '@renderer/hooks';
import { useClickOutside } from '@renderer/hooks/useClickOutside';
import {
  Note,
  ChoiceState,
  EventSelection,
  FinalState,
  State,
  Transition,
} from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { getVirtualElement } from '@renderer/utils';

import { ContextMenu, MenuItem, SubMenuContainer, SubMenu } from './ContextMenu';
import { NoteMenu } from './Menus/NoteMenu';

type MenuVariant =
  | { type: 'view'; position: Point }
  | { type: 'state'; state: State; position: Point }
  | { type: 'finalState'; state: FinalState }
  | { type: 'choiceState'; state: ChoiceState }
  | { type: 'event'; state: State; event: EventSelection }
  | { type: 'transition'; transition: Transition; position: Point }
  | { type: 'note'; note: Note; position: Point };

export const DiagramContextMenu: React.FC = () => {
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();
  const openTab = useTabs((state) => state.openTab);

  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const currentSm = stateMachines[0];

  const [isOpen, open, close] = useModal(false);
  const [menuVariant, setMenuVariant] = useState<MenuVariant | null>(null);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });

  useClickOutside(refs.floating.current, close, !isOpen, '#color-picker');

  useEffect(() => {
    const handleEvent = (menuVariant: MenuVariant, position: Point) => {
      refs.setPositionReference(getVirtualElement(position));
      setMenuVariant(menuVariant);
      open();
    };

    const handleViewContextMenu = (position: Point) => {
      handleEvent({ type: 'view', position }, position);
    };
    const handleStateContextMenu = ({ state, position }: { state: State; position: Point }) => {
      handleEvent({ type: 'state', state, position }, position);
    };
    const handleFinalStateContextMenu = (data: { state: FinalState; position: Point }) => {
      const { state, position } = data;

      handleEvent({ type: 'finalState', state }, position);
    };
    const handleChoiceStateContextMenu = (data: { state: ChoiceState; position: Point }) => {
      const { state, position } = data;

      handleEvent({ type: 'choiceState', state }, position);
    };
    const handleEventContextMenu = (data: {
      state: State;
      position: Point;
      event: EventSelection;
    }) => {
      const { state, position, event } = data;

      handleEvent({ type: 'event', state, event }, position);
    };
    const handleTransitionContextMenu = (data: { transition: Transition; position: Point }) => {
      const { transition, position } = data;

      handleEvent({ type: 'transition', transition, position }, position);
    };
    const handleNoteContextMenu = ({ position, note }: { position: Point; note: Note }) => {
      handleEvent({ type: 'note', note, position }, position);
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
  }, [editor, open, refs]);

  const content = useMemo(() => {
    if (!menuVariant) return null;
    if (menuVariant.type === 'view') {
      const { position } = menuVariant;

      const mouseOffset = editor.view.app.mouse.getOffset();
      const canvasPos = editor.view.windowToWorldCoords({
        x: position.x - mouseOffset.x,
        y: position.y - mouseOffset.y,
      });

      return (
        <ContextMenu onClose={close}>
          <MenuItem onClick={() => modelController.pasteSelected()}>
            <PasteIcon className="size-6 flex-shrink-0" /> Вставить
            <span className="ml-auto">Ctrl+V</span>
          </MenuItem>
          <MenuItem
            onClick={() =>
              modelController.createState({
                smId: currentSm,
                events: [],
                dimensions: { width: 450, height: 100 }, // TODO (L140-beep): уточнить
                name: 'Состояние',
                position: canvasPos,
                placeInCenter: true,
              })
            }
          >
            <StateIcon className="size-6 flex-shrink-0" /> Вставить состояние
          </MenuItem>
          <MenuItem
            onClick={() =>
              modelController.createFinalState({
                smId: currentSm,
                dimensions: { width: 450, height: 100 },
                position: canvasPos,
                placeInCenter: true,
              })
            }
          >
            <FinalStateIcon className="size-6 flex-shrink-0" /> Вставить конечное состояние
          </MenuItem>
          <MenuItem
            onClick={() =>
              modelController.createChoiceState({
                smId: currentSm,
                dimensions: { width: 450, height: 100 },
                position: canvasPos,
                placeInCenter: true,
              })
            }
          >
            <ChoiceStateIcon className="size-6 flex-shrink-0" /> Вставить состояние выбора
          </MenuItem>
          <MenuItem
            onClick={() => {
              modelController.createNote({
                smId: currentSm,
                position: canvasPos,
                placeInCenter: true,
                text: '',
              });

              // editor.controller.notes.emit('change', note);
            }}
          >
            <NoteIcon className="size-6 flex-shrink-0" /> Вставить заметку
          </MenuItem>
          <MenuItem
            onClick={() =>
              openTab(modelController, {
                type: 'code',
                name: modelController.model.data.name ?? 'Безымянная',
                code: modelController.model.serializer.getAll('JSON'),
                language: 'json',
              })
            }
          >
            <CodeAllIcon className="size-6 flex-shrink-0" /> Посмотреть код
          </MenuItem>
          <MenuItem onClick={() => editor.view.viewCentering()}>
            <CameraIcon className="size-6 flex-shrink-0" /> Центрировать камеру
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'state') {
      const { state, position } = menuVariant;

      return (
        <ContextMenu onClose={close}>
          <MenuItem onClick={() => modelController.copySelected()}>
            <CopyIcon className="size-6 flex-shrink-0" /> Копировать
            <span className="ml-auto">Ctrl+C</span>
          </MenuItem>

          <MenuItem onClick={() => modelController.pasteSelected()}>
            <PasteIcon className="size-6 flex-shrink-0" /> Вставить
            <span className="ml-auto">Ctrl+V</span>
          </MenuItem>

          <SubMenuContainer>
            <MenuItem closeable={false}>
              <EditIcon className="size-6 flex-shrink-0" /> Редактировать
              <span className="ml-auto">{'>'}</span>
            </MenuItem>

            <SubMenu position={position.x < 800 ? 'left' : 'right'}>
              <MenuItem onClick={() => modelController.setInitialState(currentSm, state.id)}>
                <InitialIcon className="size-6 flex-shrink-0" />
                Назначить начальным
              </MenuItem>
              <MenuItem
                onClick={() =>
                  modelController.createState({
                    smId: currentSm,
                    dimensions: { width: 100, height: 50 },
                    events: [],
                    name: 'Состояние',
                    position: editor.view.windowToWorldCoords(position),
                    parentId: state.id,
                  })
                }
              >
                <StateIcon className="size-6 flex-shrink-0" />
                Вставить состояние
              </MenuItem>
            </SubMenu>
          </SubMenuContainer>

          <MenuItem
            onClick={() =>
              openTab(modelController, {
                type: 'state',
                name: state.data.name,
                code: modelController.model.serializer.getState(currentSm, state.id) ?? '',
                language: 'json',
              })
            }
          >
            <CodeAllIcon className="size-6 flex-shrink-0" /> Посмотреть код
          </MenuItem>

          <MenuItem
            className="enabled:hover:bg-error"
            onClick={() => modelController.deleteState({ smId: currentSm, id: state.id })}
          >
            <DeleteIcon className="size-6 flex-shrink-0" /> Удалить
            <span className="ml-auto">Del</span>
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'finalState') {
      const { state } = menuVariant;
      return (
        <ContextMenu onClose={close}>
          <MenuItem
            className="enabled:hover:bg-error"
            onClick={() => modelController.deleteFinalState({ smId: currentSm, id: state.id })}
          >
            <DeleteIcon className="size-6 flex-shrink-0" /> Удалить
            <span className="ml-auto">Del</span>
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'choiceState') {
      const { state } = menuVariant;

      return (
        <ContextMenu onClose={close}>
          <MenuItem
            className="enabled:hover:bg-error"
            onClick={() => modelController.deleteChoiceState({ smId: currentSm, id: state.id })}
          >
            <DeleteIcon className="size-6 flex-shrink-0" /> Удалить
            <span className="ml-auto">Del</span>
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'event') {
      const { state, event } = menuVariant;

      return (
        <ContextMenu onClose={close}>
          <MenuItem
            className="enabled:hover:bg-error"
            onClick={() =>
              modelController.deleteEvent({
                smId: currentSm,
                stateId: state.id,
                event: event,
              })
            }
          >
            <DeleteIcon className="size-6 flex-shrink-0" /> Удалить
            <span className="ml-auto">Del</span>
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'transition') {
      const { transition, position } = menuVariant;

      const sourceArray = Array.from(editor.controller.states.getStates()).filter(
        (value) => transition.data.sourceId !== value[0]
      );
      const targetArray = Array.from(editor.controller.states.getStates()).filter(
        (value) => transition.data.targetId !== value[0]
      );

      return (
        <ContextMenu onClose={close}>
          <MenuItem onClick={() => modelController.copySelected()}>
            <CopyIcon className="size-6 flex-shrink-0" /> Копировать
            <span className="ml-auto">Ctrl+C</span>
          </MenuItem>

          <SubMenuContainer>
            <MenuItem closeable={false}>
              <EditIcon className="size-6 flex-shrink-0" /> Выбрать исход(source)
              <span className="ml-auto">{'>'}</span>
            </MenuItem>

            <SubMenu position={position.x < 800 ? 'left' : 'right'}>
              {sourceArray.map(([id, state]) => (
                <MenuItem
                  key={id}
                  onClick={() =>
                    modelController.changeTransition({
                      ...transition.data,
                      smId: currentSm,
                      id: transition.id,
                      sourceId: state.id,
                    })
                  }
                >
                  <InitialIcon className="size-6 flex-shrink-0" />
                  {state.data.name}
                </MenuItem>
              ))}
            </SubMenu>
          </SubMenuContainer>

          <SubMenuContainer>
            <MenuItem closeable={false}>
              <EditIcon className="size-6 flex-shrink-0" /> Выбрать цель(target)
              <span className="ml-auto">{'>'}</span>
            </MenuItem>

            <SubMenu position={position.x < 800 ? 'left' : 'right'}>
              {targetArray.map(([id, state]) => (
                <MenuItem
                  key={id}
                  onClick={() =>
                    modelController.changeTransition({
                      ...transition.data,
                      smId: currentSm,
                      id: transition.id,
                      targetId: state.id,
                    })
                  }
                >
                  <InitialIcon className="size-6 flex-shrink-0" />
                  {state.data.name}
                </MenuItem>
              ))}
            </SubMenu>
          </SubMenuContainer>

          <MenuItem
            onClick={() =>
              openTab(modelController, {
                type: 'transition',
                name: transition.id,
                code:
                  modelController.model.serializer.getTransition(currentSm, transition.id) ?? '',
                language: 'json',
              })
            }
          >
            <CodeAllIcon className="size-6 flex-shrink-0" /> Посмотреть код
          </MenuItem>

          <MenuItem
            className="enabled:hover:bg-error"
            onClick={() =>
              modelController.deleteTransition({
                smId: currentSm,
                id: transition.id,
              })
            }
          >
            <DeleteIcon className="size-6 flex-shrink-0" /> Удалить
            <span className="ml-auto">Del</span>
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'note') {
      const { note, position } = menuVariant;
      return <NoteMenu onClose={close} note={note} position={position} />;
    }

    return null;
  }, [close, editor, menuVariant, openTab]);

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={twMerge('z-50 w-80 rounded bg-bg-secondary p-2 shadow-xl', !isOpen && 'hidden')}
    >
      {content}
    </div>
  );
};
