import { useSyncExternalStore } from 'react';

import { EventSelection } from '@renderer/lib/drawable';
import {
  EditComponentParams,
  // DeleteComponentParams,
  UnlinkStateParams,
} from '@renderer/lib/types/ControllerTypes';
import { Point } from '@renderer/lib/types/graphics';
import {
  ChangeStateParams,
  CreateTransitionParams,
  ChangeTransitionParams,
  CreateNoteParams,
  CreateStateParams,
  CreateFinalStateParams,
  CreateChoiceStateParams,
  SwapComponentsParams,
  CreateComponentParams,
  DeleteDrawableParams,
} from '@renderer/lib/types/ModelTypes';
import { roundPoint } from '@renderer/lib/utils';
import {
  State as StateData,
  FinalState as FinalStateData,
  ChoiceState as ChoiceStateData,
  Transition as TransitionData,
  Note as NoteData,
  Action as EventAction,
  Event,
  Component,
  EventData,
  StateMachine,
} from '@renderer/types/diagram';

import { ModelController } from './ModelController';

export type PossibleActions = {
  createState: CreateStateParams & { newStateId: string };
  deleteState: { smId: string; id: string; stateData: StateData };
  changeStateName: { smId: string; id: string; name: string; prevName: string };
  changeState: {
    args: ChangeStateParams;
    prevEvents: StateData['events'];
    prevColor: StateData['color'];
  };
  changeStatePosition: { smId: string; id: string; startPosition: Point; endPosition: Point };
  linkState: { smId: string; parentId: string; childId: string; dragEndPos: Point };
  linkStateToAnotherParent: {
    smId: string;
    prevParentId: string;
    parentId: string;
    childId: string;
    dragEndPos: Point;
  };
  unlinkState: {
    smId: string;
    parentId: string;
    params: UnlinkStateParams;
    dragEndPos: Point;
  };

  createInitialState: { smId: string; targetId: string; id: string; position?: Point };
  deleteInitialState: { smId: string; targetId: string; id: string; position?: Point };
  changeInitialStatePosition: {
    smId: string;
    id: string;
    startPosition: Point;
    endPosition: Point;
  };

  createStateMachine: { smId: string } & StateMachine;
  deleteStateMachine: { smId: string } & StateMachine;

  createFinalState: CreateFinalStateParams;
  deleteFinalState: { smId: string; id: string; stateData: FinalStateData };
  changeFinalStatePosition: { smId: string; id: string; startPosition: Point; endPosition: Point };

  createChoiceState: CreateChoiceStateParams;
  deleteChoiceState: { smId: string; id: string; stateData: ChoiceStateData };
  changeChoiceStatePosition: { smId: string; id: string; startPosition: Point; endPosition: Point };

  createTransition: { smId: string; id: string; params: CreateTransitionParams };
  deleteTransition: { smId: string; id: string; prevData: TransitionData };
  changeTransition: {
    args: ChangeTransitionParams;
    prevData: TransitionData;
  };
  changeTransitionPosition: { smId: string; id: string; startPosition: Point; endPosition: Point };

  changeEvent: {
    smId: string;
    stateId: string;
    event: EventSelection;
    newValue: Event;
    prevValue: Event;
  };
  changeEventAction: {
    smId: string;
    stateId: string;
    event: EventSelection;
    newValue: EventAction;
    prevValue: EventAction;
  };
  deleteEvent: { smId: string; stateId: string; eventIdx: number; prevValue: EventData };
  deleteEventAction: {
    smId: string;
    stateId: string;
    event: EventSelection;
    prevValue: EventAction;
  };

  createComponent: { args: CreateComponentParams };
  deleteComponent: { args: DeleteDrawableParams; prevComponent: Component };
  editComponent: { args: EditComponentParams; prevComponent: Component };
  changeComponentPosition: { smId: string; name: string; startPosition: Point; endPosition: Point };
  swapComponents: SwapComponentsParams;

  createNote: { smId: string; id: string; params: CreateNoteParams };
  changeNotePosition: { smId: string; id: string; startPosition: Point; endPosition: Point };
  changeNoteText: { smId: string; id: string; text: string; prevText: string };
  changeNoteBackgroundColor: {
    smId: string;
    id: string;
    color: string | undefined;
    prevColor: string | undefined;
  };
  changeNoteTextColor: {
    smId: string;
    id: string;
    color: string | undefined;
    prevColor: string | undefined;
  };
  changeNoteFontSize: {
    smId: string;
    id: string;
    fontSize: number | undefined;
    prevFontSize: number | undefined;
  };
  deleteNote: { smId: string; id: string; prevData: NoteData };
};
export type PossibleActionTypes = keyof PossibleActions;
export type Action<T extends PossibleActionTypes> = {
  type: T;
  args: PossibleActions[T];
  numberOfConnectedActions?: number;
};
export type Stack = Array<Action<any>>;
type ActionFunctions = {
  [Type in PossibleActionTypes]: (
    sm: ModelController,
    args: PossibleActions[Type]
  ) => { undo: () => void; redo: () => void };
};
type ActionDescriptions = {
  [Type in PossibleActionTypes]: (args: PossibleActions[Type]) => {
    name: string;
    description: string;
  };
};

export const actionFunctions: ActionFunctions = {
  createStateMachine: (sM, args) => ({
    redo: sM.createStateMachine.bind(sM, args.smId, { ...args }, false),
    undo: sM.deleteStateMachine.bind(sM, args.smId, false),
  }),
  deleteStateMachine: (sM, args) => ({
    redo: sM.deleteStateMachine.bind(sM, args.smId, false),
    undo: sM.createStateMachine.bind(sM, args.smId, { ...args }, false),
  }),
  createState: (sM, args) => ({
    redo: sM.createState.bind(
      sM,
      { ...args, id: args.newStateId, linkByPoint: false, canBeInitial: false },
      false
    ),
    undo: sM.deleteState.bind(sM, { smId: args.smId, id: args.newStateId }, false),
  }),
  deleteState: (sM, { id, smId, stateData }) => ({
    redo: sM.deleteState.bind(sM, { smId, id }, false),
    undo: sM.createState.bind(
      sM,
      {
        smId,
        name: stateData.name,
        id,
        dimensions: stateData.dimensions,
        position: stateData.position,
        parentId: stateData.parentId,
        events: stateData.events,
        color: stateData.color,
        linkByPoint: false,
        canBeInitial: false,
      },
      false
    ),
  }),
  changeStateName: (sM, { smId, id, name, prevName }) => ({
    redo: sM.changeStateName.bind(sM, smId, id, name, false),
    undo: sM.changeStateName.bind(sM, smId, id, prevName, false),
  }),

  changeState: (sM, { args, prevEvents, prevColor }) => ({
    redo: sM.changeState.bind(sM, args, false),
    undo: sM.changeState.bind(
      sM,
      {
        ...args,
        events: prevEvents,
        color: prevColor,
      },
      false
    ),
  }),

  linkStateToAnotherParent: (sM, { smId, prevParentId, parentId, childId, dragEndPos }) => ({
    redo: sM.linkState.bind(
      sM,
      { smId, parentId, childId, canBeInitial: false, dragEndPos },
      false,
      true
    ),
    undo: sM.linkState.bind(sM, { smId, parentId: prevParentId, childId }, false),
  }),

  linkState: (sM, { smId, parentId, childId, dragEndPos }) => ({
    redo: sM.linkState.bind(
      sM,
      { smId, parentId, childId, canBeInitial: false, dragEndPos },
      false,
      true
    ),
    undo: sM.unlinkState.bind(sM, { smId, id: childId, canUndo: false }),
  }),
  unlinkState: (sM, { smId, parentId, params, dragEndPos }) => ({
    redo: sM.unlinkState.bind(sM, { ...params, parentId, childId: params.id, canUndo: false }),
    undo: sM.linkState.bind(
      sM,
      { smId, parentId, childId: params.id, canBeInitial: false, dragEndPos },
      false,
      true
    ),
  }),
  changeStatePosition: (sM, { smId, id, startPosition, endPosition }) => ({
    redo: sM.changeStatePosition.bind(sM, { smId, id, startPosition, endPosition }, false),
    undo: sM.changeStatePosition.bind(
      sM,
      { smId, id, startPosition: endPosition, endPosition: startPosition },
      false
    ),
  }),

  createInitialState: (sM, args) => ({
    redo: sM.createInitialStateWithTransition.bind(
      sM,
      args.smId,
      args.targetId,
      false,
      args.position
    ),
    undo: sM.deleteInitialStateWithTransition.bind(sM, args.smId, args.targetId, false),
  }),
  deleteInitialState: (sM, args) => ({
    redo: sM.deleteInitialStateWithTransition.bind(sM, args.smId, args.targetId, false),
    undo: sM.createInitialStateWithTransition.bind(
      sM,
      args.smId,
      args.targetId,
      false,
      args.position
    ),
  }),
  changeInitialStatePosition: (sM, { smId, id, startPosition, endPosition }) => ({
    redo: sM.changeInitialStatePosition.bind(sM, { smId, id, startPosition, endPosition }, false),
    undo: sM.changeInitialStatePosition.bind(sM, { smId, id, endPosition, startPosition }, false),
  }),

  createFinalState: (sM, args) => ({
    redo: sM.createFinalState.bind(
      sM,
      { ...args, id: args.id, linkByPoint: false, canBeInitial: false },
      false
    ),
    undo: sM.deleteFinalState.bind(sM, { smId: args.smId, id: args.id! }, false),
  }),
  deleteFinalState: (sM, { smId, id, stateData }) => ({
    redo: sM.deleteFinalState.bind(sM, { smId, id }, false),
    undo: sM.createFinalState.bind(
      sM,
      {
        smId: smId,
        dimensions: stateData.dimensions,
        id,
        position: stateData.position,
        parentId: stateData.parentId,
        linkByPoint: false,
      },
      false
    ),
  }),
  changeFinalStatePosition: (sM, { smId, id, startPosition, endPosition }) => ({
    redo: sM.changeFinalStatePosition.bind(sM, { smId, id, startPosition, endPosition }, false),
    undo: sM.changeFinalStatePosition.bind(
      sM,
      {
        smId,
        id,
        startPosition: endPosition,
        endPosition: startPosition,
      },
      false
    ),
  }),

  createChoiceState: (sM, args) => ({
    redo: sM.createChoiceState.bind(
      sM,
      { ...args, id: args.id, linkByPoint: false, canBeInitial: false },
      false
    ),
    undo: sM.deleteChoiceState.bind(sM, { ...args, id: args.id!, smId: args.smId }, false),
  }),
  deleteChoiceState: (sM, { id, smId, stateData }) => ({
    redo: sM.deleteChoiceState.bind(sM, { smId: smId, id }, false),
    undo: sM.createChoiceState.bind(
      sM,
      {
        smId,
        dimensions: stateData.dimensions,
        id,
        position: stateData.position,
        parentId: stateData.parentId,
        linkByPoint: false,
      },
      false
    ),
  }),
  changeChoiceStatePosition: (sM, { smId, id, startPosition, endPosition }) => ({
    redo: sM.changeChoiceStatePosition.bind(sM, { smId, id, startPosition, endPosition }, false),
    undo: sM.changeChoiceStatePosition.bind(
      sM,
      {
        smId,
        id,
        startPosition: endPosition,
        endPosition: startPosition,
      },
      false
    ),
  }),

  createTransition: (sM, { smId, id, params }) => ({
    redo: sM.createTransition.bind(sM, { ...params, smId, id }, false, false),
    undo: sM.deleteTransition.bind(sM, { smId, id }, false),
  }),

  deleteTransition: (sM, { id, prevData, smId }) => ({
    redo: sM.deleteTransition.bind(sM, { smId, sM, id }, false),
    undo: sM.createTransition.bind(
      sM,
      {
        ...prevData,
        id,
        smId,
      },
      false,
      false
    ),
  }),
  changeTransition: (sM, { args, prevData }) => ({
    redo: sM.changeTransition.bind(sM, args, false),
    undo: sM.changeTransition.bind(
      sM,
      {
        smId: args.smId,
        id: args.id,
        ...prevData,
      },
      false
    ),
  }),
  changeTransitionPosition: (sM, { smId, id, startPosition, endPosition }) => ({
    redo: sM.changeTransitionPosition.bind(
      sM,
      {
        smId,
        id,
        startPosition,
        endPosition,
      },
      false
    ),
    undo: sM.changeTransitionPosition.bind(
      sM,
      {
        smId,
        id,
        startPosition: endPosition,
        endPosition: startPosition,
      },
      false
    ),
  }),

  changeEvent: (sM, { smId, stateId, event, newValue, prevValue }) => ({
    redo: sM.changeEvent.bind(sM, {
      smId,
      stateId,
      event,
      newValue,
      canUndo: false,
    }),
    undo: sM.changeEvent.bind(sM, {
      smId,
      stateId,
      event,
      newValue: prevValue,
      canUndo: false,
    }),
  }),
  changeEventAction: (sM, { smId, stateId, event, newValue, prevValue }) => ({
    redo: sM.changeEvent.bind(sM, {
      smId,
      stateId,
      event,
      newValue,
      canUndo: false,
    }),
    undo: sM.changeEvent.bind(sM, {
      smId,
      stateId,
      event,
      newValue: prevValue,
      canUndo: false,
    }),
  }),
  deleteEvent: (sM, { stateId, smId, eventIdx, prevValue }) => ({
    redo: sM.deleteEvent.bind(sM, { smId, stateId, event: { eventIdx, actionIdx: null } }, false),
    undo: sM.createEvent.bind(sM, { smId, stateId, eventData: prevValue, eventIdx }),
  }),
  deleteEventAction: (sM, { smId, stateId, event, prevValue }) => ({
    redo: sM.deleteEvent.bind(sM, { smId, stateId, event }, false),
    undo: sM.createEventAction.bind(sM, { smId, stateId, event, value: prevValue }),
  }),

  createComponent: (sM, { args }) => ({
    redo: sM.createComponent.bind(sM, args, false),
    undo: sM.deleteComponent.bind(sM, { id: args.id, smId: args.smId, purge: false }, false),
  }),
  deleteComponent: (sM, { args, prevComponent }) => ({
    redo: sM.deleteComponent.bind(sM, args, false),
    undo: sM.createComponent.bind(sM, { id: args.id, smId: args.smId, ...prevComponent }, false),
  }),
  editComponent: (sM, { args, prevComponent }) => ({
    redo: sM.editComponent.bind(sM, args, false),
    undo: sM.editComponent.bind(
      sM,
      {
        smId: args.smId,
        type: args.type,
        id: args.newId ?? args.id,
        name: prevComponent.name,
        parameters: prevComponent.parameters,
        newId: args.newId ? args.id : undefined,
      },
      false
    ),
  }),
  changeComponentPosition: (sM, { smId, name, startPosition, endPosition }) => ({
    redo: sM.changeComponentPosition.bind(
      sM,
      { smId, id: name, startPosition, endPosition },
      false
    ),
    undo: sM.changeComponentPosition.bind(
      sM,
      { smId, id: name, startPosition: endPosition, endPosition: startPosition },
      false
    ),
  }),
  swapComponents: (sM, { smId, name1, name2 }) => ({
    redo: sM.swapComponents.bind(sM, { smId, name1, name2 }, false),
    undo: sM.swapComponents.bind(
      sM,
      {
        smId,
        name1: name2,
        name2: name1,
      },
      false
    ),
  }),

  createNote: (sM, { id, params }) => ({
    redo: sM.createNote.bind(sM, { id, ...params }, false),
    undo: sM.deleteNote.bind(sM, { smId: params.smId, id }, false),
  }),
  changeNoteText: (sM, { smId, id, text, prevText }) => ({
    redo: sM.changeNoteText.bind(sM, { smId, id, text }, false),
    undo: sM.changeNoteText.bind(sM, { smId, id, text: prevText }, false),
  }),
  changeNotePosition: (sM, { smId, id, startPosition, endPosition }) => ({
    redo: sM.changeNotePosition.bind(sM, { smId, id, startPosition, endPosition }, false),
    undo: sM.changeNotePosition.bind(
      sM,
      { smId, id, startPosition: endPosition, endPosition: startPosition },
      false
    ),
  }),
  changeNoteBackgroundColor: (sM, { smId, id, color, prevColor }) => ({
    redo: sM.changeNoteBackgroundColor.bind(
      sM,
      { smId, id, backgroundColor: color, prevColor },
      false
    ),
    undo: sM.changeNoteBackgroundColor.bind(
      sM,
      { smId, id, backgroundColor: prevColor, prevColor: color },
      false
    ),
  }),
  changeNoteTextColor: (sM, { smId, id, color, prevColor }) => ({
    redo: sM.changeNoteTextColor.bind(
      sM,
      { smId, id, textColor: color, prevColor: prevColor },
      false
    ),
    undo: sM.changeNoteTextColor.bind(
      sM,
      { smId, id, textColor: prevColor, prevColor: color },
      false
    ),
  }),
  changeNoteFontSize: (sM, { smId, id, fontSize, prevFontSize }) => ({
    redo: sM.changeNoteFontSize.bind(
      sM,
      { smId, id, fontSize: fontSize, prevColor: prevFontSize },
      false
    ),
    undo: sM.changeNoteFontSize.bind(
      sM,
      { smId, id, fontSize: prevFontSize, prevColor: fontSize },
      false
    ),
  }),
  deleteNote: (sM, { smId, id, prevData }) => ({
    redo: sM.deleteNote.bind(sM, { smId, id }, false),
    undo: sM.createNote.bind(sM, { smId, id, ...prevData }, false),
  }),
};

export const actionDescriptions: ActionDescriptions = {
  createStateMachine: (args) => ({
    name: 'Создание МС',
    description: `Имя: ${args.name ?? args.smId}, платформа ${args.platform}`,
  }),
  createState: (args) => ({
    name: 'Создание состояния',
    description: `Имя: ${args.name}`,
  }),
  deleteState: (args) => ({
    name: 'Удаление состояния',
    description: `Имя: ${args.stateData.name}`,
  }),
  changeStateName: (args) => ({
    name: 'Изменение имени состояния',
    description: `Было: "${args.prevName}"\nСтало: "${args.name}"`,
  }),
  linkStateToAnotherParent: (args) => ({
    name: 'Присоединение состояния',
    description: `Было "${args.parentId}"\nСтало: "${args.prevParentId}"`,
  }),
  linkState: (args) => ({
    name: 'Присоединение состояния',
    description: `Id: "${args.childId}"\nId родителя: "${args.parentId}"`,
  }),
  unlinkState: (args) => ({
    name: 'Отсоединение состояния',
    description: `Id: "${args.params.id}"\nId родителя: "${args.parentId}"`,
  }),
  changeStatePosition: (args) => ({
    name: 'Перемещение состояния',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),
  deleteStateMachine: (args) => ({
    name: 'Удаление машины состояний',
    description: `Id: "${args.smId}"\n name: "${args.name ?? 'Имя отсутствует'}"`,
  }),
  createInitialState: () => ({
    name: 'Создание начального состояния',
    description: ``,
  }),
  changeState: ({ args, prevEvents, prevColor }) => ({
    name: 'Изменение состояния',
    description: `Id состояния: ${args.id}\nБыло: ${JSON.stringify({
      events: prevEvents,
      color: prevColor,
    })}\nСтало: ${JSON.stringify({ events: args.events, color: args.color })}`,
  }),
  deleteInitialState: () => ({
    name: 'Удаление начального состояния',
    description: ``,
  }),
  changeInitialStatePosition: (args) => ({
    name: 'Перемещение начального состояния',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  createFinalState: () => ({
    name: 'Создание конечного состояния',
    description: ``,
  }),
  deleteFinalState: () => ({
    name: 'Удаление конечного состояния',
    description: ``,
  }),
  changeFinalStatePosition: (args) => ({
    name: 'Перемещение конечного состояния',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  createChoiceState: () => ({
    name: 'Создание состояния выбора',
    description: ``,
  }),
  deleteChoiceState: () => ({
    name: 'Удаление состояния выбора',
    description: ``,
  }),
  changeChoiceStatePosition: (args) => ({
    name: 'Перемещение состояния выбора',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  createTransition: (args) => ({ name: 'Создание перехода', description: `Id: ${args.id}` }),
  deleteTransition: (args) => ({
    name: 'Удаление перехода',
    description: `Id: ${args.id}`,
  }),
  changeTransition: (args) => ({ name: 'Изменение перехода', description: `Id: ${args.args.id}` }),
  changeTransitionPosition: (args) => ({
    name: 'Перемещение перехода',
    description: `Id: "${args.id}"\nБыло: ${JSON.stringify(
      roundPoint(args.startPosition)
    )}\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  changeEvent: (args) => ({
    name: 'Изменение события состояния',
    description: `Id состояния: ${args.stateId}\nПозиция: ${JSON.stringify(
      args.event
    )}\nБыло: ${JSON.stringify(args.prevValue)}\nСтало: ${JSON.stringify(args.newValue)}`,
  }),
  changeEventAction: (args) => ({
    name: 'Изменение действия в событии',
    description: `Id состояния: ${args.stateId}\nПозиция: ${JSON.stringify(
      args.event
    )}\nБыло: ${JSON.stringify(args.prevValue)}\nСтало: ${JSON.stringify(args.newValue)}`,
  }),
  deleteEvent: (args) => ({
    name: 'Удаление события',
    description: `Id состояния: ${args.stateId}\nПозиция: ${args.eventIdx}`,
  }),
  deleteEventAction: (args) => ({
    name: 'Удаление действия в событии',
    description: `Id состояния: ${args.stateId}\nПозиция: ${JSON.stringify(args.event)}`,
  }),

  createComponent: ({ args }) => ({
    name: 'Добавление компонента',
    description: `Имя: ${args.name}\nТип: ${args.type}`,
  }),
  deleteComponent: ({ args, prevComponent }) => ({
    name: 'Удаление компонента',
    description: `Имя: ${args.id}\nТип: ${prevComponent.type}`,
  }),
  editComponent: ({ args, prevComponent }) => {
    const prev = { prevComponent, id: args.id, name: args.name };
    const newComp = { ...args, type: prevComponent.type };
    delete newComp.newId;

    return {
      name: 'Изменение компонента',
      description: `Было: ${JSON.stringify(prev)}\nСтало: ${JSON.stringify(newComp)}`,
    };
  },
  changeComponentPosition: (args) => ({
    name: 'Перемещение компонента',
    description: `Имя: "${args.name}"\nБыло: ${JSON.stringify(
      roundPoint(args.startPosition)
    )}\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),
  swapComponents: ({ name1, name2 }) => ({
    name: 'Перетасовка компонентов в списке',
    description: `Имя1: ${name1}\nИмя2: ${name2}`,
  }),

  createNote: (args) => ({ name: 'Создание заметки', description: `Id: ${args.id}` }),
  changeNoteText: (args) => ({
    name: 'Изменение текста заметки',
    description: `ID: ${args.id}\nБыло: "${args.prevText}"\nСтало: "${args.text}"`,
  }),
  changeNoteBackgroundColor: (args) => ({
    name: 'Изменение цвета заметки',
    description: `ID: ${args.id}\nБыло: "${args.prevColor}"\nСтало: "${args.color}"`,
  }),
  changeNoteTextColor: (args) => ({
    name: 'Изменение цвета текста заметки',
    description: `ID: ${args.id}\nБыло: "${args.prevColor}"\nСтало: "${args.color}"`,
  }),
  changeNoteFontSize: (args) => ({
    name: 'Изменение размера шрифта заметки',
    description: `ID: ${args.id}\nБыло: "${args.prevFontSize}"\nСтало: "${args.fontSize}"`,
  }),
  changeNotePosition: (args) => ({
    name: 'Перемещение заметки',
    description: `Id: "${args.id}"\nБыло: ${JSON.stringify(
      roundPoint(args.startPosition)
    )}\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),
  deleteNote: (args) => ({
    name: 'Удаление заметки',
    description: `ID: ${args.id} Текст: ${args.prevData.text}`,
  }),

  // deleteStateMachine: ({ args, prevStateMachine }) => ({
  //   name: 'Удаление компонента',
  //   description: `Имя: ${args.id}`,
  // }),
};

export const STACK_SIZE_LIMIT = 100;

export class History {
  undoStack = [] as Stack;
  redoStack = [] as Stack;

  private listeners = [] as (() => void)[];
  private cachedSnapshot = { undoStack: this.undoStack, redoStack: this.redoStack };

  constructor(private stateMachine: ModelController) {}

  do<T extends PossibleActionTypes>(action: Action<T>) {
    this.redoStack.length = 0;
    this.undoStack.push(action);

    this.checkUndoStackLimit();

    this.updateSnapshot();
  }

  undo = () => {
    if (this.isUndoStackEmpty()) return;

    const action = this.undoStack.pop() as Action<any>;

    actionFunctions[action.type](this.stateMachine, action.args).undo();

    if (action.numberOfConnectedActions) {
      for (let i = 0; i < action.numberOfConnectedActions; i++) {
        this.undo();
      }
    }

    // Если соединённые действия то первое должно попасть в конец redo стека
    this.redoStack.push(action);

    this.updateSnapshot();
  };

  redo = () => {
    if (this.isRedoStackEmpty()) return;

    const action = this.redoStack.pop() as Action<any>;

    actionFunctions[action.type](this.stateMachine, action.args).redo();

    if (action.numberOfConnectedActions) {
      for (let i = 0; i < action.numberOfConnectedActions; i++) {
        this.redo();
      }
    }

    // Если соединённые действия то первое должно попасть в конец undo стека
    this.undoStack.push(action);

    this.checkUndoStackLimit();

    this.updateSnapshot();
  };

  isUndoStackEmpty() {
    return this.undoStack.length === 0;
  }

  isRedoStackEmpty() {
    return this.redoStack.length === 0;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;

    this.updateSnapshot();
  }

  // Есди привышен лимит стека то удаляем первые СОЕДИНЕННЫЕ действия
  private checkUndoStackLimit() {
    if (this.undoStack.length <= STACK_SIZE_LIMIT) return;

    // Нужно пройти по стеку вниз, чтобы найти именно первую группу элементов
    let i = this.undoStack.length - 1;
    let lastNumberOfConnectedActions = 1;
    while (i >= 0) {
      if (this.undoStack[i]?.numberOfConnectedActions === undefined) {
        lastNumberOfConnectedActions = 1;
        i -= 1;
      } else {
        lastNumberOfConnectedActions = this.undoStack[i].numberOfConnectedActions as number;
        i -= lastNumberOfConnectedActions + 1;
      }
    }

    this.undoStack = this.undoStack.slice(lastNumberOfConnectedActions + 1);
  }

  private updateSnapshot = () => {
    this.cachedSnapshot = { undoStack: this.undoStack, redoStack: this.redoStack };
    this.listeners.forEach((l) => l());
  };

  private subscribe = (listener: () => void) => {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  };

  use = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(this.subscribe, () => this.cachedSnapshot);
  };
}
