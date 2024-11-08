import throttle from 'lodash.throttle';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import {
  State,
  EventSelection,
  InitialState,
  FinalState,
  ChoiceState,
} from '@renderer/lib/drawable';
import { MyMouseEvent, Layer, DeleteInitialStateParams } from '@renderer/lib/types';
import {
  UnlinkStateParams,
  LinkStateParams,
  getStatesControllerDefaultData,
  StatesControllerDataStateType,
  StateVariant,
  ChangeStateNameParams,
  CreateInitialStateControllerParams,
} from '@renderer/lib/types/ControllerTypes';
import { Point } from '@renderer/lib/types/graphics';
import {
  ChangeEventParams,
  ChangePosition,
  ChangeStateParams,
  CreateChoiceStateParams,
  CreateEventActionParams,
  CreateEventParams,
  CreateFinalStateParams,
  CreateStateParams,
  DeleteDrawableParams,
  DeleteEventParams,
} from '@renderer/lib/types/ModelTypes';
import { Event } from '@renderer/types/diagram';

type DragHandler = (state: State, e: { event: MyMouseEvent }) => void;

type DragInfo = {
  parentId: string;
  childId: string;
  smId: string;
} | null;

interface StatesControllerEvents {
  mouseUpOnState: State | ChoiceState;
  mouseUpOnInitialState: InitialState;
  mouseUpOnFinalState: FinalState;
  startNewTransitionState: State | ChoiceState;
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

  createState = (args: CreateStateParams) => {
    const { id, smId } = args;

    if (!id) return;
    const state = new State(this.app, id, smId, { ...args }); // Создание вьюшки

    this.data.states.set(state.id, state);

    this.view.children.add(state, Layer.States);

    this.watch(state);

    this.view.isDirty = true;
  };

  changeStateName = (args: ChangeStateNameParams) => {
    const { id, name } = args;
    const state = this.data.states.get(id);
    if (!state) return;

    state.data.name = name;
    this.view.isDirty = true;
  };

  changeStatePosition = (args: ChangePosition) => {
    const { id, endPosition } = args;
    const state = this.data.states.get(id);
    if (!state) return;
    state.position = endPosition;
    this.view.isDirty = true;
  };

  linkState = (args: LinkStateParams) => {
    const { parentId, childId } = args;

    const parent = this.data.states.get(parentId);
    const child = this.data.states.get(childId);

    if (!parent || !child) return;

    (child.parent || this.view).children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);

    this.view.isDirty = true;
  };

  unlinkState = (params: UnlinkStateParams) => {
    const { id, canUndo } = params;

    const state = this.data.states.get(id);
    if (!state || !state.parent) return;

    state.parent.children.remove(state, Layer.States);
    this.view.children.add(state, Layer.States);
    state.parent = undefined;

    if (canUndo) {
      state.addOnceOff('dragend');
    }

    this.view.isDirty = true;
  };

  deleteState = (args: DeleteDrawableParams) => {
    const { id } = args;
    const state = this.data.states.get(id);
    if (!state) return;

    (state.parent || this.view).children.remove(state, Layer.States); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.states.delete(id); // Удаляем само вью
    this.view.isDirty = true;
  };

  createInitialState = (params: CreateInitialStateControllerParams) => {
    const { id, targetId } = params;

    const target = this.data.states.get(targetId);
    if (!target || !id) return;

    const state = new InitialState(this.app, id, { ...params });

    this.data.initialStates.set(id, state);

    (target.parent || this.view).children.add(state, Layer.InitialStates);

    if (target.parent) {
      state.parent = target.parent;
    }

    this.watch(state);

    return state;
  };

  deleteInitialState = (params: DeleteInitialStateParams) => {
    const { id } = params;

    const state = this.data.initialStates.get(id);
    if (!state) return;

    (state.parent || this.view).children.remove(state, Layer.InitialStates); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.initialStates.delete(state.id); // Удаляем само вью

    this.view.isDirty = true;
  };

  changeInitialStatePosition = (args: ChangePosition) => {
    const { id } = args;
    const state = this.data.initialStates.get(id);
    if (!state) return;

    this.view.isDirty = true;
  };

  createFinalState = (params: CreateFinalStateParams) => {
    const { id, smId } = params;
    if (!id) return;
    const state = new FinalState(this.app, id, smId, { ...params });

    this.data.finalStates.set(id, state);

    this.view.children.add(state, Layer.FinalStates);

    this.watch(state);
    this.view.isDirty = true;

    return state;
  };

  deleteFinalState = (args: DeleteDrawableParams) => {
    const { id } = args;
    const state = this.data.finalStates.get(id);
    if (!state) return;

    (state.parent || this.view).children.remove(state, Layer.FinalStates); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обработчик событий с вью
    this.data.finalStates.delete(id); // Удаляем само вью

    this.view.isDirty = true;
  };

  linkFinalState = (args: LinkStateParams) => {
    const { childId, parentId } = args;
    const state = this.data.finalStates.get(childId);
    const parent = this.data.states.get(parentId);
    if (!state || !parent) return;

    state.parent = parent;
    this.view.children.remove(state, Layer.FinalStates);
    parent.children.add(state, Layer.FinalStates);

    this.view.isDirty = true;
  };

  changeFinalStatePosition = (args: ChangePosition) => {
    const { id } = args;
    const state = this.data.finalStates.get(id);
    if (!state) return;

    this.view.isDirty = true;
  };

  createChoiceState = (params: CreateChoiceStateParams) => {
    const { id, smId } = params;
    if (!id) return;
    const state = new ChoiceState(this.app, id, smId, { ...params });

    this.data.choiceStates.set(id, state);

    this.view.children.add(state, Layer.ChoiceStates);

    this.watch(state);

    this.view.isDirty = true;
  };

  deleteChoiceState = (args: DeleteDrawableParams) => {
    const { id } = args;
    const state = this.data.choiceStates.get(id);
    if (!state) return;

    (state.parent || this.view).children.remove(state, Layer.ChoiceStates); // Отсоединяемся вью от родителя
    this.unwatch(state); // Убираем обрабочик событий с вью
    this.data.choiceStates.delete(id); // Удаляем само вью

    this.view.isDirty = true;
  };

  changeChoiceStatePosition = (args: ChangePosition) => {
    const { id, endPosition } = args;
    const state = this.data.choiceStates.get(id);
    if (!state) return;

    state.position = endPosition;

    this.view.isDirty = true;
  };

  updateAll() {
    this.forEachState((state) => {
      state.updateEventBox();
    });

    this.view.isDirty = true;
  }

  linkChoiceState = (args: LinkStateParams) => {
    const { childId, parentId } = args;
    const state = this.data.choiceStates.get(childId);
    const parent = this.data.states.get(parentId);
    if (!state || !parent) return;

    state.parent = parent;
    this.view.children.remove(state, Layer.ChoiceStates);
    parent.children.add(state, Layer.ChoiceStates);

    this.view.isDirty = true;
  };

  createEvent = (args: CreateEventParams) => {
    const { stateId } = args;
    const state = this.data.states.get(stateId);
    if (!state) return;

    state.updateEventBox();

    this.view.isDirty = true;
  };

  createEventAction = (args: CreateEventActionParams) => {
    const { stateId } = args;
    const state = this.data.states.get(stateId);
    if (!state) return;

    state.updateEventBox();

    this.view.isDirty = true;
  };

  changeState = (args: ChangeStateParams) => {
    const { id, events } = args;

    const state = this.data.states.get(id);
    if (!state) return;

    state.data.events = events;

    state.updateEventBox();

    this.view.isDirty = true;
  };

  // Редактирование события в состояниях
  changeEvent = (args: ChangeEventParams) => {
    const state = this.data.states.get(args.stateId);
    if (!state) return;

    state.updateEventBox();

    this.view.isDirty = true;
  };

  // Удаление события в состояниях
  //TODO показывать предупреждение при удалении события в состоянии(модалка)
  deleteEvent = (args: DeleteEventParams) => {
    const state = this.data.states.get(args.stateId);
    if (!state) return;

    state.updateEventBox();

    this.view.isDirty = true;
  };

  handleStartNewTransition = (state: State | ChoiceState) => {
    this.emit('startNewTransitionState', state);
  };

  handleMouseUpOnState = (state: State | ChoiceState) => {
    this.emit('mouseUpOnState', state);
  };

  //Необходимо, чтобы можно можно было создать связь от комментария к блоку обозначения начального состояния, иначе отпускание кнопки мыши не будет работать.
  handleMouseUpOnInitialState = (state: InitialState) => {
    this.emit('mouseUpOnInitialState', state);
  };

  handleMouseUpOnFinalState = (state: FinalState) => {
    this.emit('mouseUpOnFinalState', state);
  };

  handleStateClick = (state: State, e: { event: MyMouseEvent }) => {
    const drawBounds = state.drawBounds;
    const titleHeight = state.titleHeight;
    const y = e.event.y - drawBounds.y;
    const x = e.event.x - drawBounds.x;

    if (y <= titleHeight && x >= drawBounds.width - 25 / this.controller.scale) {
      this.emit('changeStateName', state);
    }
  };

  handleStateMouseDown = (state: State, e: { event: MyMouseEvent }) => {
    // Пустое название машины состояний - заглушка
    this.controller.selectState({ smId: '', id: state.id });
    this.controller.emit('selectState', { smId: state.smId, id: state.id });
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
      return this.emit('changeStateName', state);
    }

    if (!this.app.controller.visual) {
      return this.emit('changeState', state);
    }

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

      this.emit('changeEvent', { state, eventSelection, event: event as Event, isEditingEvent });
    }
  };

  handleContextMenu = (stateId: string, e: { event: MyMouseEvent }) => {
    const state = this.data.states.get(stateId);
    if (!state) return;
    this.controller.selectState({ smId: '', id: state.id });

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

    this.unlinkState({ smId: '', id: state.id });
  };

  handleDrag: DragHandler = throttle<DragHandler>((state, e) => {
    const possibleParent = (state.parent ?? this.view).getCapturedNode({
      position: e.event,
      exclude: [state],
      includeChildrenHeight: false,
      layer: Layer.States,
    });

    this.dragInfo = null;

    if (possibleParent instanceof State) {
      this.dragInfo = {
        smId: possibleParent.smId,
        parentId: possibleParent.id,
        childId: state.id,
      };
    }
  }, 100);

  handleDragEnd = (state: State, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    if (this.dragInfo && state instanceof State) {
      this.linkState({
        smId: '',
        parentId: this.dragInfo.parentId,
        childId: this.dragInfo.childId,
      });
      this.app.controller.emit('linkState', {
        smId: this.dragInfo.smId,
        childId: this.dragInfo.childId,
        parentId: this.dragInfo.parentId,
      });
      this.dragInfo = null;
    }

    this.changeStatePosition({ smId: '', id: state.id, endPosition: e.dragEndPosition });
  };

  handleInitialStateDragEnd = (
    state: InitialState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeInitialStatePosition({ smId: '', id: state.id, endPosition: e.dragEndPosition });
  };

  handleFinalStateDragEnd = (
    state: InitialState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeFinalStatePosition({ smId: '', id: state.id, endPosition: e.dragEndPosition });
  };

  handleFinalStateContextMenu = (stateId: string, e: { event: MyMouseEvent }) => {
    const item = this.data.finalStates.get(stateId);
    if (!item) return;
    this.emit('finalStateContextMenu', {
      state: item,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleChoiceStateMouseDown = (state: ChoiceState) => {
    this.controller.selectChoice({ smId: '', id: state.id });
    this.controller.emit('selectChoice', { smId: state.smId, id: state.id });
  };

  handleChoiceStateDragEnd = (
    state: ChoiceState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeChoiceStatePosition({ smId: '', id: state.id, endPosition: e.dragEndPosition });
  };

  handleChoiceStateContextMenu = (stateId: string, e: { event: MyMouseEvent }) => {
    const item = this.data.choiceStates.get(stateId);
    if (!item) return;
    this.controller.selectChoice({ smId: '', id: stateId });
    this.emit('choiceStateContextMenu', {
      state: item,
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

  unwatchAll() {
    for (const itemsMap of Object.values(this.data)) {
      for (const item of itemsMap.values()) {
        this.unwatch(item);
      }
    }
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
    state.on('contextmenu', this.handleContextMenu.bind(this, state.id));
    state.on('drag', this.handleDrag.bind(this, state));
    state.on('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition.bind(this, state);
    state.edgeHandlers.bindEvents();
  }
  private unwatchState(state: State) {
    state.off('dragend', this.handleDragEnd.bind(this, state));
    state.off('click', this.handleStateClick.bind(this, state));
    state.off('mousedown', this.handleStateMouseDown.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.off('contextmenu', this.handleContextMenu.bind(this, state.id));
    state.off('drag', this.handleDrag.bind(this, state));
    state.off('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.unbindEvents();
  }
  private watchInitialState(state: InitialState) {
    state.on('dragend', this.handleInitialStateDragEnd.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnInitialState.bind(this, state));
  }
  private unwatchInitialState(state: InitialState) {
    state.off('dragend', this.handleInitialStateDragEnd.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnInitialState.bind(this, state));
  }
  private watchFinalState(state: FinalState) {
    state.on('dragend', this.handleFinalStateDragEnd.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnFinalState.bind(this, state));
    state.on('contextmenu', this.handleFinalStateContextMenu.bind(this, state.id));
  }
  private unwatchFinalState(state: FinalState) {
    state.off('dragend', this.handleInitialStateDragEnd.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnFinalState.bind(this, state));
    state.off('contextmenu', this.handleFinalStateContextMenu.bind(this, state.id));
  }
  private watchChoiceState(state: ChoiceState) {
    state.on('dragend', this.handleChoiceStateDragEnd.bind(this, state));
    state.on('mousedown', this.handleChoiceStateMouseDown.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('contextmenu', this.handleChoiceStateContextMenu.bind(this, state.id));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition.bind(this, state);
    state.edgeHandlers.bindEvents();
  }
  private unwatchChoiceState(state: ChoiceState) {
    state.off('dragend', this.handleChoiceStateDragEnd.bind(this, state));
    state.off('mousedown', this.handleChoiceStateMouseDown.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('contextmenu', this.handleChoiceStateContextMenu.bind(this, state.id));

    state.edgeHandlers.unbindEvents();
  }
}
