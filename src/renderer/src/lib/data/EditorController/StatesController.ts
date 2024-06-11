import throttle from 'lodash.throttle';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { INITIAL_STATE_OFFSET } from '@renderer/lib/constants';
import {
  State,
  EventSelection,
  InitialState,
  FinalState,
  ChoiceState,
} from '@renderer/lib/drawable';
import { MyMouseEvent, Layer, DeleteInitialStateParams } from '@renderer/lib/types';
import {
  CCreateInitialStateParams,
  UnlinkStateParams,
  LinkStateParams,
  getStatesControllerDefaultData,
  StatesControllerDataStateType,
  StateVariant,
} from '@renderer/lib/types/EditorController';
import {
  ChangeStateEventsParams,
  CreateChoiceStateParams,
  CreateFinalStateParams,
  CreateStateParams,
} from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { Action, Event, EventData } from '@renderer/types/diagram';

type DragHandler = (state: State, e: { event: MyMouseEvent }) => void;

type DragInfo = {
  parentId: string;
  childId: string;
} | null;

interface StatesControllerEvents {
  mouseUpOnState: State | ChoiceState;
  mouseUpOnFinalState: FinalState;
  startNewTransition: State | ChoiceState;
  changeState: State;
  changeStateName: State;
  stateContextMenu: { state: State; position: Point };
  finalStateContextMenu: { state: FinalState; position: Point };
  choiceStateContextMenu: { state: ChoiceState; position: Point };
  changeEvent: {
    state: State;
    eventSelection: EventSelection;
    event: Event;
    isEditingEvent: boolean;
  };
  eventContextMenu: { state: State; event: EventSelection; position: Point };
}

/**
 * Контроллер состояний.
 * Хранит вью всех видов состояний.
 * Реализовывает все действия связанные со всеми видами состояний.
 * Навешивает события на вью состояний.
 *
 * TODO(bryzZz) numberOfConnectedActions неочевидный, нужно чтобы функция сама возвращала сколько действий в историю она положила
 */
export class StatesController extends EventEmitter<StatesControllerEvents> {
  dragInfo: DragInfo = null;

  data = getStatesControllerDefaultData();

  constructor(private app: CanvasEditor) {
    super();
  }

  private get view() {
    return this.app.view;
  }

  private get controller() {
    return this.app.controller;
  }

  private get history() {
    return this.app.controller.history;
  }

  /**
   * ! По всем видам состояний
   */
  get(id: string) {
    for (const key in this.data) {
      const item = this.data[key as StatesControllerDataStateType].get(id);
      if (item) {
        return item;
      }
    }

    return undefined;
  }
  clear() {
    this.data.states.clear();
    this.data.initialStates.clear();
    this.data.finalStates.clear();
    this.data.choiceStates.clear();
  }
  forEach(callback: (state: StateVariant) => void) {
    this.data.states.forEach(callback);
    this.data.initialStates.forEach(callback);
    this.data.finalStates.forEach(callback);
    this.data.choiceStates.forEach(callback);
  }

  getStates() {
    return this.data.states;
  }

  forEachState(callback: (state: State) => void) {
    return this.data.states.forEach(callback);
  }

  /**
   * Если parentId равен undefined то проход будет по верхнеуровневым состояниям
   */
  forEachByParentId(parentId: string | undefined, callback: (state: State) => void) {
    return this.data.states.forEach((state) => {
      if (state.data.parentId === parentId) {
        callback(state);
      }
    });
  }

  private getSiblings(
    stateId: string | undefined,
    parentId: string | undefined,
    stateType: StatesControllerDataStateType = 'states'
  ) {
    return [...this.data[stateType].values()].filter(
      (s) => s.data.parentId === parentId && s.id !== stateId
    );
  }

  createState = (args: CreateStateParams, canUndo = true) => {
    const { parentId, position, linkByPoint = true, canBeInitial = true } = args;

    const newStateId = this.app.model.createState(args); // Создание данных
    const state = new State(this.app, newStateId); // Создание вьюшки

    this.data.states.set(state.id, state);

    this.view.children.add(state, Layer.States);

    let numberOfConnectedActions = 0;

    // вкладываем состояние, если оно создано над другим
    if (parentId) {
      this.linkState({ parentId, childId: newStateId, canBeInitial }, canUndo);
      numberOfConnectedActions += 1;
    } else if (linkByPoint) {
      // TODO(bryzZz) Тут перемешаны разные виды координат, в Shape отлов клика идет по координатам окна, нужно переделать на мировые
      const possibleParent = this.getPossibleParentState(this.view.worldToWindowCoords(position), [
        state.id,
      ]);
      if (possibleParent) {
        this.linkState(
          { parentId: possibleParent.id, childId: state.id, addOnceOff: true },
          canUndo
        );
        numberOfConnectedActions += 1;
      }
    }

    // Если не было начального состояния, им станет новое
    if (canBeInitial && this.getSiblings(state.id, state.data.parentId, 'states').length === 0) {
      this.createInitialStateWithTransition(state.id, canUndo);
      numberOfConnectedActions += 2; // Создание начального состояния и перехода
    }

    this.watch(state);

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'createState',
        args: { ...args, newStateId },
        numberOfConnectedActions,
      });
    }
  };

  changeStateEvents(args: ChangeStateEventsParams, canUndo = true) {
    const { id } = args;

    const state = this.data.states.get(id);
    if (!state) return;

    if (canUndo) {
      const prevEvent = state.data.events.find(
        (value) =>
          args.triggerComponent === value.trigger.component &&
          args.triggerMethod === value.trigger.method &&
          undefined === value.trigger.args // FIXME: сравнение по args может не работать
      );

      const prevActions = structuredClone(prevEvent?.do ?? []);

      this.history.do({
        type: 'changeStateEvents',
        args: { args, prevActions },
      });
    }

    this.app.model.changeStateEvents(args);

    state.updateEventBox();

    this.view.isDirty = true;
  }

  changeStateName = (id: string, name: string, canUndo = true) => {
    const state = this.data.states.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStateName',
        args: { id, name, prevName: state.data.name },
      });
    }

    this.app.model.changeStateName(id, name);

    this.view.isDirty = true;
  };

  changeStatePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const state = this.data.states.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStatePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.app.model.changeStatePosition(id, endPosition);

    this.view.isDirty = true;
  }

  linkState(args: LinkStateParams, canUndo = true) {
    const { parentId, childId, addOnceOff = false, canBeInitial = true } = args;

    const parent = this.data.states.get(parentId);
    const child = this.data.states.get(childId);

    if (!parent || !child) return;

    let numberOfConnectedActions = 0;

    // Проверка на то что состояние является, тем на которое есть переход из начального
    // TODO(bryzZz) Вынести в функцию
    const stateTransitions = this.controller.transitions.getAllByTargetId(childId) ?? [];
    const transitionFromInitialState = stateTransitions.find(
      ({ source }) => source instanceof InitialState
    );

    if (transitionFromInitialState) {
      this.setInitialState(parentId, canUndo);
      numberOfConnectedActions += 2;
    }

    this.app.model.linkState(parentId, childId);
    this.changeStatePosition(childId, child.position, { x: 0, y: 0 }, false);

    (child.parent || this.view).children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);

    // Перелинковка переходов
    //! Нужно делать до создания перехода из начального состояния
    this.controller.transitions.forEachByStateId(childId, (transition) => {
      this.controller.transitions.linkTransition(transition.id);
    });

    // Если не было начального состояния, им станет новое
    if (canBeInitial && this.getSiblings(child.id, child.data.parentId, 'states').length === 0) {
      this.changeStatePosition(
        childId,
        child.position,
        { x: INITIAL_STATE_OFFSET, y: INITIAL_STATE_OFFSET },
        false
      );
      this.createInitialStateWithTransition(child.id, canUndo);
      numberOfConnectedActions += 2;
    }

    if (canUndo) {
      this.history.do({
        type: 'linkState',
        args: { parentId, childId },
        numberOfConnectedActions,
      });
      if (addOnceOff) {
        child.addOnceOff('dragend'); // Линковка состояния меняет его позицию и это плохо для undo
      }
    }

    this.view.isDirty = true;
  }

  private getPossibleParentState(position: Point, exclude: string[] = []) {
    // назначаем родительское состояние по месту его создания
    let possibleParent: State | null = null;
    for (const item of this.data.states.values()) {
      if (exclude.includes(item.id)) continue;
      if (!item.isUnderMouse(position, true)) continue;

      if (possibleParent === null) {
        possibleParent = item;
        continue;
      }

      // учитываем вложенность, нужно поместить состояние
      // в максимально дочернее
      let searchPending = true;
      while (searchPending) {
        searchPending = false;
        // TODO(bryzZz) Нужно проверять по модели а не по вью
        for (const child of possibleParent.children.layers?.[Layer.States] || []) {
          if (!(child instanceof State)) continue;
          if (exclude.includes(child.id)) continue;
          if (!child.isUnderMouse(position, true)) continue;

          possibleParent = child as State;
          searchPending = true;
          break;
        }
      }
    }

    return possibleParent;
  }

  unlinkState(params: UnlinkStateParams, canUndo = true) {
    const { id } = params;

    const state = this.data.states.get(id);
    if (!state || !state.parent) return;

    const parentId = state.parent.id;
    let numberOfConnectedActions = 0;

    // Проверка на то что состояние является, тем на которое есть переход из начального
    // TODO(bryzZz) Вынести в функцию
    const stateTransitions = this.controller.transitions.getAllByTargetId(id) ?? [];
    const transitionFromInitialState = stateTransitions.find(
      ({ source }) => source instanceof InitialState
    );

    if (transitionFromInitialState) {
      // Перемещаем начальное состояние, на первое найденное в родителе
      const newState = [...this.data.states.values()].find(
        (s) => s.data.parentId === parentId && s.id !== id
      );

      if (newState) {
        this.setInitialState(newState?.id, canUndo);
      } else {
        this.deleteInitialStateWithTransition(transitionFromInitialState.source.id, canUndo);
      }

      numberOfConnectedActions += 2;
    }

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newPosition = { ...state.compoundPosition };
    this.changeStatePosition(id, state.position, newPosition, canUndo);
    numberOfConnectedActions += 1;

    this.app.model.unlinkState(id);

    state.parent.children.remove(state, Layer.States);
    this.view.children.add(state, Layer.States);
    state.parent = undefined;

    if (canUndo) {
      this.history.do({
        type: 'unlinkState',
        args: { parentId, params },
        numberOfConnectedActions,
      });
      state.addOnceOff('dragend');
    }

    this.view.isDirty = true;
  }

  deleteState = (id: string, canUndo = true) => {
    const state = this.data.states.get(id);
    if (!state) return;

    const parentId = state.data.parentId;
    let numberOfConnectedActions = 0;

    // Проверка на то что состояние является, тем на которое есть переход из начального
    const stateTransitions = this.controller.transitions.getAllByTargetId(id) ?? [];
    const transitionFromInitialState = stateTransitions.find(
      ({ source }) => source instanceof InitialState
    );

    if (transitionFromInitialState) {
      // Перемещаем начальное состояние, на первое найденное в родителе
      const newState = [...this.data.states.values()].find(
        (s) => s.data.parentId === parentId && s.id !== id
      );

      if (newState) {
        this.setInitialState(newState?.id, canUndo);
      } else {
        this.deleteInitialStateWithTransition(transitionFromInitialState.source.id, canUndo);
      }

      numberOfConnectedActions += 2;
    }

    // Удаляем зависимые переходы
    this.controller.transitions.forEachByStateId(id, (transition) => {
      this.controller.transitions.deleteTransition(transition.id, canUndo);
      numberOfConnectedActions += 1;
    });

    // Ищем дочерние состояния и отвязываем их от текущего
    this.forEachByParentId(id, (childState) => {
      // Если есть родительское, перепривязываем к нему
      if (state.data.parentId) {
        this.linkState({ parentId: state.data.parentId, childId: childState.id }, canUndo);
      } else {
        this.unlinkState({ id: childState.id }, canUndo);
      }

      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteState',
        args: { id, stateData: { ...structuredClone(state.data), parentId } },
        numberOfConnectedActions,
      });
    }

    (state.parent || this.view).children.remove(state, Layer.States); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.states.delete(id); // Удаляем само вью
    this.app.model.deleteState(id); // Удаляем модель

    this.view.isDirty = true;
  };

  private createInitialStateWithTransition(targetId: string, canUndo = true) {
    const state = this.createInitialState({ targetId }, canUndo);
    const target = this.data.states.get(targetId);
    if (!state || !target) return;

    this.controller.transitions.createTransition(
      {
        source: state.id,
        target: target.id,
      },
      canUndo
    );
  }
  private deleteInitialStateWithTransition(initialStateId: string, canUndo = true) {
    const transition = this.controller.transitions.getBySourceId(initialStateId);
    const targetId = transition?.data.target;
    if (!transition || !targetId) return;

    this.controller.transitions.deleteTransition(transition.id, canUndo);

    this.deleteInitialState({ id: initialStateId, targetId }, canUndo);
  }

  createInitialState(params: CCreateInitialStateParams, canUndo = true) {
    const { id: prevId, targetId } = params;

    const target = this.data.states.get(targetId);
    if (!target) return;

    const position = {
      x: target.position.x - INITIAL_STATE_OFFSET,
      y: target.position.y - INITIAL_STATE_OFFSET,
    };

    if (target.data.parentId) {
      position.x = Math.max(0, position.x);
      position.y = Math.max(0, position.y);
    }

    const id = this.app.model.createInitialState({
      position,
      parentId: target.data.parentId,
      id: prevId,
    });

    const state = new InitialState(this.app, id);

    this.data.initialStates.set(id, state);

    (target.parent || this.view).children.add(state, Layer.InitialStates);

    if (target.parent) {
      state.parent = target.parent;
    }

    this.watch(state);

    if (canUndo) {
      this.history.do({
        type: 'createInitialState',
        args: { id, targetId },
      });
    }

    return state;
  }

  deleteInitialState(params: DeleteInitialStateParams, canUndo = true) {
    const { id } = params;

    const state = this.data.initialStates.get(id);
    if (!state) return;

    (state.parent || this.view).children.remove(state, Layer.InitialStates); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.initialStates.delete(state.id); // Удаляем само вью
    this.app.model.deleteInitialState(state.id); // Удаляем модель

    if (canUndo) {
      this.history.do({
        type: 'deleteInitialState',
        args: params,
      });
    }

    this.view.isDirty = true;
  }

  changeInitialStatePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const state = this.data.initialStates.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeInitialStatePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.app.model.changeInitialStatePosition(id, endPosition);

    this.view.isDirty = true;
  }

  /**
   * Назначить состояние начальным
   * TODO(bryzZz) Очень сложно искать переход из начального состояния в обычное состояние
   */
  setInitialState(stateId: string, canUndo = true) {
    const state = this.data.states.get(stateId);
    if (!state) return;

    // Проверка на то что состояние уже является, тем на которое есть переход из начального
    const stateTransitions = this.controller.transitions.getAllByTargetId(stateId) ?? [];
    if (stateTransitions.find(({ source }) => source instanceof InitialState)) return;

    const siblingsIds = this.getSiblings(state.id, state.data.parentId, 'states').map((s) => s.id);
    const siblingsTransitions = this.controller.transitions.getAllByTargetId(siblingsIds);
    const transitionFromInitialState = siblingsTransitions.find(
      (transition) => transition.source instanceof InitialState
    );

    const initialState = transitionFromInitialState?.source as InitialState;

    if (!transitionFromInitialState) return;

    const position = {
      x: state.position.x - INITIAL_STATE_OFFSET,
      y: state.position.y - INITIAL_STATE_OFFSET,
    };

    if (state.data.parentId) {
      position.x = Math.max(0, position.x);
      position.y = Math.max(0, position.y);
    }

    this.controller.transitions.changeTransition(
      {
        id: transitionFromInitialState.id,
        ...transitionFromInitialState.data,
        target: stateId,
      },
      canUndo
    );
    this.changeInitialStatePosition(initialState.id, initialState.position, position, canUndo);
  }

  createFinalState(params: CreateFinalStateParams, canUndo = true) {
    const { parentId, linkByPoint = true } = params;

    // Проверка на то что в скоупе уже есть конечное состояние
    // Страшно, очень страшно
    const parent = parentId
      ? this.data.states.get(parentId)
      : linkByPoint
      ? this.getPossibleParentState(params.position)
      : null;
    const siblings = this.getSiblings(params.id, parent?.id, 'finalStates');
    if (siblings.length) return;

    const id = this.app.model.createFinalState(params);

    const state = new FinalState(this.app, id);

    this.data.finalStates.set(id, state);

    this.view.children.add(state, Layer.FinalStates);

    if (parentId) {
      this.linkFinalState(id, parentId);
    } else if (linkByPoint && parent) {
      const newPosition = {
        x: state.data.position.x - parent.compoundPosition.x,
        y: state.data.position.y - parent.compoundPosition.y - parent.data.dimensions.height,
      };

      this.linkFinalState(id, parent.id);
      this.app.model.changeFinalStatePosition(id, newPosition);
    }

    this.watch(state);

    if (canUndo) {
      this.history.do({
        type: 'createFinalState',
        args: { ...params, ...state.data, newStateId: id },
        numberOfConnectedActions: 0,
      });
    }

    this.view.isDirty = true;

    return state;
  }

  deleteFinalState(id: string, canUndo = true) {
    const state = this.data.finalStates.get(id);
    if (!state) return;

    const parentId = state.data.parentId;
    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    this.controller.transitions.forEachByTargetId(id, (transition) => {
      this.controller.transitions.deleteTransition(transition.id, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteFinalState',
        args: { id, stateData: { ...structuredClone(state.data), parentId } },
        numberOfConnectedActions,
      });
    }

    (state.parent || this.view).children.remove(state, Layer.FinalStates); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.finalStates.delete(id); // Удаляем само вью
    this.app.model.deleteFinalState(id); // Удаляем модель

    this.view.isDirty = true;
  }

  private linkFinalState(stateId: string, parentId: string) {
    const state = this.data.finalStates.get(stateId);
    const parent = this.data.states.get(parentId);
    if (!state || !parent) return;

    this.app.model.linkFinalState(stateId, parentId);

    state.parent = parent;
    this.view.children.remove(state, Layer.FinalStates);
    parent.children.add(state, Layer.FinalStates);

    this.view.isDirty = true;
  }

  changeFinalStatePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const state = this.data.finalStates.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeFinalStatePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.app.model.changeFinalStatePosition(id, endPosition);

    this.view.isDirty = true;
  }

  createChoiceState(params: CreateChoiceStateParams, canUndo = true) {
    const { parentId, position, linkByPoint = true } = params;

    const id = this.app.model.createChoiceState(params);

    const state = new ChoiceState(this.app, id);

    this.data.choiceStates.set(id, state);

    this.view.children.add(state, Layer.ChoiceStates);

    if (parentId) {
      this.linkChoiceState(id, parentId);
    } else if (linkByPoint) {
      const parent = this.getPossibleParentState(position);
      if (parent) {
        const newPosition = {
          x: state.data.position.x - parent.compoundPosition.x,
          y: state.data.position.y - parent.compoundPosition.y - parent.data.dimensions.height,
        };
        this.linkChoiceState(id, parent.id);
        this.app.model.changeChoiceStatePosition(id, newPosition);
      }
    }

    this.watch(state);

    if (canUndo) {
      this.history.do({
        type: 'createChoiceState',
        args: { ...params, ...state.data, newStateId: id },
        numberOfConnectedActions: 0,
      });
    }

    this.view.isDirty = true;
  }

  deleteChoiceState(id: string, canUndo = true) {
    const state = this.data.choiceStates.get(id);
    if (!state) return;

    const parentId = state.data.parentId;
    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    this.controller.transitions.forEachByStateId(id, (transition) => {
      this.controller.transitions.deleteTransition(transition.id, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteChoiceState',
        args: { id, stateData: { ...structuredClone(state.data), parentId } },
        numberOfConnectedActions,
      });
    }

    (state.parent || this.view).children.remove(state, Layer.ChoiceStates); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.choiceStates.delete(id); // Удаляем само вью
    this.app.model.deleteChoiceState(id); // Удаляем модель

    this.view.isDirty = true;
  }

  changeChoiceStatePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const state = this.data.choiceStates.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeChoiceStatePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.app.model.changeChoiceStatePosition(id, endPosition);

    this.view.isDirty = true;
  }

  private linkChoiceState(stateId: string, parentId: string) {
    const state = this.data.choiceStates.get(stateId);
    const parent = this.data.states.get(parentId);
    if (!state || !parent) return;

    this.app.model.linkChoiceState(stateId, parentId);

    state.parent = parent;
    this.view.children.remove(state, Layer.ChoiceStates);
    parent.children.add(state, Layer.ChoiceStates);

    this.view.isDirty = true;
  }

  createEvent(stateId: string, eventData: EventData, eventIdx?: number) {
    const state = this.data.states.get(stateId);
    if (!state) return;

    this.app.model.createEvent(stateId, eventData, eventIdx);

    state.updateEventBox();

    this.view.isDirty = true;
  }

  createEventAction(stateId: string, event: EventSelection, value: Action) {
    const state = this.data.states.get(stateId);
    if (!state) return;

    this.app.model.createEventAction(stateId, event, value);

    state.updateEventBox();

    this.view.isDirty = true;
  }

  // Редактирование события в состояниях
  changeEvent(stateId: string, event: EventSelection, newValue: Event | Action, canUndo = true) {
    const state = this.data.states.get(stateId);
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.app.model.changeEventAction(stateId, event, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEventAction',
          args: { stateId, event, newValue, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx].trigger;

      this.app.model.changeEvent(stateId, eventIdx, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEvent',
          args: { stateId, event, newValue, prevValue },
        });
      }
    }

    state.updateEventBox();

    this.view.isDirty = true;
  }

  // Удаление события в состояниях
  //TODO показывать предупреждение при удалении события в состоянии(модалка)
  deleteEvent(stateId: string, event: EventSelection, canUndo = true) {
    const state = this.data.states.get(stateId);
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      // Проверяем если действие в событие последнее то надо удалить всё событие
      if (state.data.events[eventIdx].do.length === 1) {
        return this.deleteEvent(stateId, { eventIdx, actionIdx: null });
      }

      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.app.model.deleteEventAction(stateId, event);

      if (canUndo) {
        this.history.do({
          type: 'deleteEventAction',
          args: { stateId, event, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx];

      this.app.model.deleteEvent(stateId, eventIdx);

      if (canUndo) {
        this.history.do({
          type: 'deleteEvent',
          args: { stateId, eventIdx, prevValue },
        });
      }
    }

    state.updateEventBox();

    this.view.isDirty = true;
  }

  handleStartNewTransition = (state: State | ChoiceState) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (state: State | ChoiceState) => {
    this.emit('mouseUpOnState', state);
  };

  handleMouseUpOnFinalState = (state: FinalState) => {
    this.emit('mouseUpOnFinalState', state);
  };

  handleStateClick = (state: State, e: { event: MyMouseEvent }) => {
    const drawBounds = state.drawBounds;
    const titleHeight = state.titleHeight;
    const y = e.event.y - drawBounds.y;
    const x = e.event.x - drawBounds.x;

    if (y <= titleHeight && x >= drawBounds.width - 25 / this.app.model.data.scale) {
      this.emit('changeStateName', state);
    }
  };

  handleStateMouseDown = (state: State, e: { event: MyMouseEvent }) => {
    this.controller.selectState(state.id);

    const targetPos = state.computedPosition;
    const titleHeight = state.titleHeight;
    const y = e.event.y - targetPos.y;
    // FIXME: если будет учёт нажатий на дочерний контейнер, нужно отсеять их здесь
    if (y > titleHeight) {
      // FIXME: пересчитывает координаты внутри, ещё раз
      state.eventBox.handleClick({ x: e.event.x, y: e.event.y });
    }
  };

  handleStateDoubleClick = (state: State, e: { event: MyMouseEvent }) => {
    const targetPos = state.computedPosition;
    const titleHeight = state.computedTitleSizes.height;
    const y = e.event.y - targetPos.y;
    if (y <= titleHeight) {
      this.emit('changeStateName', state);
    } else {
      // FIXME: если будет учёт нажатий на дочерний контейнер, нужно отсеять их здесь
      // FIXME: пересчитывает координаты внутри, ещё раз
      const eventSelection = state.eventBox.handleDoubleClick({ x: e.event.x, y: e.event.y });
      if (!eventSelection) {
        this.emit('changeState', state);
      } else {
        const eventData = state.eventBox.data[eventSelection.eventIdx];
        const event =
          eventSelection.actionIdx === null
            ? eventData.trigger
            : eventData.do[eventSelection.actionIdx];
        const isEditingEvent = eventSelection.actionIdx === null;

        this.emit('changeEvent', { state, eventSelection, event, isEditingEvent });
      }
    }
  };

  handleContextMenu = (state: State, e: { event: MyMouseEvent }) => {
    this.controller.selectState(state.id);

    const eventIdx = state.eventBox.handleClick({
      x: e.event.x,
      y: e.event.y,
    });

    const offset = this.app.mouse.getOffset();

    if (eventIdx) {
      this.emit('eventContextMenu', {
        state,
        position: {
          x: e.event.x + offset.x,
          y: e.event.y + offset.y,
        },
        event: eventIdx,
      });
    } else {
      this.emit('stateContextMenu', {
        state,
        position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
      });
    }
  };

  // TODO: визуальная обратная связь
  // если состояние вложено – отсоединяем
  handleLongPress = (state: State) => {
    if (!state.data.parentId) return;

    this.unlinkState({ id: state.id });
  };

  handleDrag: DragHandler = throttle<DragHandler>((state, e) => {
    const possibleParent = (state.parent ?? this.view).getCapturedNode({
      position: e.event,
      exclude: [state],
      includeChildrenHeight: false,
      layer: Layer.States,
    });

    this.dragInfo = null;

    if (possibleParent) {
      this.dragInfo = {
        parentId: possibleParent.id,
        childId: state.id,
      };
    }
  }, 100);

  handleDragEnd = (state: State, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    if (this.dragInfo && state instanceof State) {
      this.linkState({ parentId: this.dragInfo.parentId, childId: this.dragInfo.childId });
      this.dragInfo = null;
      return;
    }

    this.changeStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  };

  handleInitialStateDragEnd(
    state: InitialState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) {
    this.changeInitialStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  }

  handleFinalStateDragEnd(
    state: InitialState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) {
    this.changeFinalStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  }

  handleFinalStateContextMenu = (state: FinalState, e: { event: MyMouseEvent }) => {
    this.emit('finalStateContextMenu', {
      state,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleChoiceStateMouseDown = (state: ChoiceState) => {
    this.controller.selectChoiceState(state.id);
  };

  handleChoiceStateDragEnd(
    state: ChoiceState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) {
    this.changeChoiceStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  }

  handleChoiceStateContextMenu = (state: ChoiceState, e: { event: MyMouseEvent }) => {
    this.emit('choiceStateContextMenu', {
      state,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  watch(state: StateVariant) {
    if (state instanceof State) {
      return this.watchState(state);
    }

    if (state instanceof FinalState) {
      return this.watchFinalState(state);
    }

    if (state instanceof ChoiceState) {
      return this.watchChoiceState(state);
    }

    this.watchInitialState(state);
  }

  unwatch(state: StateVariant) {
    if (state instanceof State) {
      return this.unwatchState(state);
    }

    if (state instanceof FinalState) {
      return this.unwatchFinalState(state);
    }

    if (state instanceof ChoiceState) {
      return this.unwatchChoiceState(state);
    }

    this.unwatchInitialState(state);
  }

  private watchState(state: State) {
    state.on('dragend', this.handleDragEnd.bind(this, state));
    state.on('click', this.handleStateClick.bind(this, state));
    state.on('mousedown', this.handleStateMouseDown.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.on('contextmenu', this.handleContextMenu.bind(this, state));
    state.on('drag', this.handleDrag.bind(this, state));
    state.on('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition.bind(this, state);
  }
  private unwatchState(state: State) {
    state.off('dragend', this.handleDragEnd.bind(this, state));
    state.off('click', this.handleStateClick.bind(this, state));
    state.off('mousedown', this.handleStateMouseDown.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.off('contextmenu', this.handleContextMenu.bind(this, state));
    state.off('drag', this.handleDrag.bind(this, state));
    state.off('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.unbindEvents();
  }
  private watchInitialState(state: InitialState) {
    state.on('dragend', this.handleInitialStateDragEnd.bind(this, state));
  }
  private unwatchInitialState(state: InitialState) {
    state.off('dragend', this.handleInitialStateDragEnd.bind(this, state));
  }
  private watchFinalState(state: FinalState) {
    state.on('dragend', this.handleFinalStateDragEnd.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnFinalState.bind(this, state));
    state.on('contextmenu', this.handleFinalStateContextMenu.bind(this, state));
  }
  private unwatchFinalState(state: FinalState) {
    state.off('dragend', this.handleInitialStateDragEnd.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnFinalState.bind(this, state));
    state.off('contextmenu', this.handleFinalStateContextMenu.bind(this, state));
  }
  private watchChoiceState(state: ChoiceState) {
    state.on('dragend', this.handleChoiceStateDragEnd.bind(this, state));
    state.on('mousedown', this.handleChoiceStateMouseDown.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('contextmenu', this.handleChoiceStateContextMenu.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition.bind(this, state);
  }
  private unwatchChoiceState(state: ChoiceState) {
    state.off('dragend', this.handleChoiceStateDragEnd.bind(this, state));
    state.off('mousedown', this.handleChoiceStateMouseDown.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('contextmenu', this.handleChoiceStateContextMenu.bind(this, state));

    state.edgeHandlers.unbindEvents();
  }
}
