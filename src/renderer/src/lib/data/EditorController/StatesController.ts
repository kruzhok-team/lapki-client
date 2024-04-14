import throttle from 'lodash.throttle';

import { EditorView } from '@renderer/lib/basic';
import { EventEmitter } from '@renderer/lib/common';
import { INITIAL_STATE_OFFSET } from '@renderer/lib/constants';
import { History } from '@renderer/lib/data/History';
import { State, EventSelection, InitialState } from '@renderer/lib/drawable';
import { MyMouseEvent, Layer } from '@renderer/lib/types';
import { UnlinkStateParams } from '@renderer/lib/types/EditorController';
import { ChangeStateEventsParams, CreateStateParams } from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { Action, Event, EventData } from '@renderer/types/diagram';

type DragHandler = (state: State, e: { event: MyMouseEvent }) => void;

type DragInfo = {
  parentId: string;
  childId: string;
} | null;

interface StatesControllerEvents {
  mouseUpOnState: State;
  startNewTransition: State;
  changeState: State;
  changeStateName: State;
  stateContextMenu: { state: State; position: Point };
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
 */
export class StatesController extends EventEmitter<StatesControllerEvents> {
  dragInfo: DragInfo = null;

  private states: Map<string, State> = new Map();
  private initialStates: Map<string, InitialState> = new Map();

  constructor(private view: EditorView, private history: History) {
    super();
  }

  get(id: string) {
    return this.states.get(id) || this.initialStates.get(id);
  }
  setState = this.states.set.bind(this.states);
  clear() {
    this.states.clear();
    this.initialStates.clear();
  }
  forEach(callback: (state: State | InitialState) => void) {
    this.states.forEach(callback);
    this.initialStates.forEach(callback);
  }

  getStates() {
    return this.states;
  }

  forEachState(callback: (state: State) => void) {
    return this.states.forEach(callback);
  }

  /**
   * Если parentId равен undefined то проход будет по верхнеуровневым состояниям
   */
  forEachByParentId(parentId: string | undefined, callback: (state: State) => void) {
    return this.states.forEach((state) => {
      if (state.data.parentId === parentId) {
        callback(state);
      }
    });
  }

  createState = (args: CreateStateParams, canUndo = true) => {
    const { parentId, position, linkByPoint = true } = args;

    const newStateId = this.view.app.model.createState(args); // Создание данных
    const state = new State(this.view, newStateId); // Создание вьюшки

    this.states.set(state.id, state);

    this.view.children.add(state, Layer.States);

    let numberOfConnectedActions = 0;

    // вкладываем состояние, если оно создано над другим
    if (parentId) {
      this.linkState(parentId, newStateId, canUndo);
      numberOfConnectedActions += 1;
    } else if (linkByPoint) {
      this.linkStateByPoint(state, position);
    }

    // Если не было начального состояния, им станет новое
    // TODO(bryzZz) тут не приятно что проверка идёт по вью а не по модели
    if ((state.parent || this.view).children.layers[Layer.States].length === 1) {
      this.createInitialStateWithTransition(state, canUndo);
      // numberOfConnectedActions += 1;
    }

    this.watch(state);

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'stateCreate',
        args: { ...args, newStateId },
        numberOfConnectedActions,
      });
    }
  };

  changeStateEvents(args: ChangeStateEventsParams, canUndo = true) {
    const { id } = args;

    const state = this.states.get(id);
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

    this.view.app.model.changeStateEvents(args);

    state.updateEventBox();

    this.view.isDirty = true;
  }

  changeStateName = (id: string, name: string, canUndo = true) => {
    const state = this.states.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStateName',
        args: { id, name, prevName: state.data.name },
      });
    }

    this.view.app.model.changeStateName(id, name);

    this.view.isDirty = true;
  };

  changeStatePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const state = this.states.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStatePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.view.app.model.changeStatePosition(id, endPosition);

    this.view.isDirty = true;
  }

  linkState(parentId: string, childId: string, canUndo = true, addOnceOff = false) {
    const parent = this.states.get(parentId);
    const child = this.states.get(childId);

    if (!parent || !child) return;

    let numberOfConnectedActions = 0;
    if (child.data.parentId) {
      this.unlinkState({ id: childId }, canUndo);
      numberOfConnectedActions += 1;
    }

    this.view.app.model.linkState(parentId, childId);
    this.changeStatePosition(childId, child.position, { x: 0, y: 0 }, false);

    (child.parent || this.view).children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);

    const isFirstChild = child.parent.children.layers[Layer.States].length === 1;

    // Если не было начального состояния, им станет новое
    if (isFirstChild) {
      this.changeStatePosition(
        childId,
        child.position,
        { x: INITIAL_STATE_OFFSET, y: INITIAL_STATE_OFFSET },
        false
      );
      this.createInitialStateWithTransition(child, canUndo);
      // numberOfConnectedActions += 1;
      // state.parent.children.layers[Layer.NormalStates].add(state, Layer.NormalStates);
    }

    this.view.controller.transitions.forEachByStateId(childId, (transition) => {
      this.view.controller.transitions.linkTransition(transition.id);
    });

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

  linkStateByPoint(state: State, position: Point) {
    // назначаем родительское состояние по месту его создания
    let possibleParent: State | undefined = undefined;
    for (const item of this.states.values()) {
      if (state.id == item.id) continue;
      if (item.isUnderMouse(position, true)) {
        if (typeof possibleParent === 'undefined') {
          possibleParent = item;
        } else {
          // учитываем вложенность, нужно поместить состояние
          // в максимально дочернее
          let searchPending = true;
          while (searchPending) {
            searchPending = false;
            for (const child of possibleParent.children.layers[Layer.States]) {
              if (!(child instanceof State)) continue;
              if (state.id === child.id) continue;
              if (child.isUnderMouse(position, true)) {
                possibleParent = child as State;
                searchPending = true;
                break;
              }
            }
          }
        }
      }
    }
    if (possibleParent !== state && possibleParent) {
      this.linkState(possibleParent.id, state.id, true, true);
    }
  }

  unlinkState(params: UnlinkStateParams, canUndo = true) {
    const { id } = params;

    const state = this.states.get(id);
    if (!state || !state.parent) return;

    const parentId = state.parent.id;

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newPosition = { ...state.compoundPosition };
    this.changeStatePosition(id, state.position, newPosition, canUndo);

    this.view.app.model.unlinkState(id);

    state.parent.children.remove(state, Layer.States);
    this.view.children.add(state, Layer.States);
    state.parent = undefined;

    if (canUndo) {
      this.history.do({
        type: 'unlinkState',
        args: { parentId, params },
        numberOfConnectedActions: 1, // Изменение позиции
      });
      state.addOnceOff('dragend');
    }

    this.view.isDirty = true;
  }

  deleteState = (id: string, canUndo = true) => {
    const state = this.states.get(id);
    if (!state) return;

    const parentId = state.data.parentId;
    let numberOfConnectedActions = 0;

    // Удаляем зависимые события, нужно это делать тут а нет в данных потому что модели тоже должны быть удалены и события на них должны быть отвязаны
    this.view.controller.transitions.forEachByStateId(id, (transition) => {
      // Если удаляемое состояние было начальным, стираем текущее значение
      if (transition.source instanceof InitialState && transition.target.id === state.id) {
        this.deleteInitialState(transition.source, canUndo);
        // numberOfConnectedActions += 1;

        // Перемещаем начальное состояние, на первое найденное в родителе
        const newState = [...this.states.values()].find(
          (s) => s.data.parentId === parentId && s.id !== id
        ) as State | undefined;

        if (newState) {
          this.createInitialStateWithTransition(newState, canUndo);
          // numberOfConnectedActions += 1;
        }
      }

      this.view.controller.transitions.deleteTransition(transition.id, canUndo);
      numberOfConnectedActions += 1;
    });

    // Ищем дочерние состояния и отвязываем их от текущего, делать это нужно тут потому что поле children есть только в модели и его нужно поменять
    this.forEachByParentId(id, (childState) => {
      // Если есть родительское, перепривязываем к нему
      if (state.data.parentId) {
        this.linkState(state.data.parentId, childState.id, canUndo);
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
    this.states.delete(id); // Удаляем само вью
    this.view.app.model.deleteState(id); // Удаляем модель

    this.view.isDirty = true;
  };

  private deleteInitialState(state: InitialState, canUndo = true) {
    // Отсоединяемся от родительского состояния, если такое есть.
    (state.parent || this.view).children.remove(state, Layer.InitialStates);

    this.view.app.model.deleteInitialState(state.id);
    this.unwatch(state);
    this.initialStates.delete(state.id);

    this.view.isDirty = true;
  }

  private createInitialStateWithTransition(target: State, canUndo = true) {
    const id = this.view.app.model.createInitialState({
      position: {
        x: target.position.x - INITIAL_STATE_OFFSET,
        y: target.position.y - INITIAL_STATE_OFFSET,
      },
      parentId: target.data.parentId,
    });

    const state = new InitialState(this.view, id);

    this.initialStates.set(id, state);

    (target.parent || this.view).children.add(state, Layer.InitialStates);

    if (target.parent) {
      state.parent = target.parent;
    }

    this.watch(state);

    // if (canUndo) {
    //   this.history.do({
    //     type: 'createInitialState',
    //     args: structuredClone(state.data),
    //   });
    // }

    this.view.controller.transitions.createTransition(
      {
        color: '#FFF',
        source: state.id,
        target: target.id,
      },
      false
    );
  }

  createEvent(stateId: string, eventData: EventData, eventIdx?: number) {
    const state = this.states.get(stateId);
    if (!state) return;

    this.view.app.model.createEvent(stateId, eventData, eventIdx);

    state.updateEventBox();

    this.view.isDirty = true;
  }

  createEventAction(stateId: string, event: EventSelection, value: Action) {
    const state = this.states.get(stateId);
    if (!state) return;

    this.view.app.model.createEventAction(stateId, event, value);

    state.updateEventBox();

    this.view.isDirty = true;
  }

  // Редактирование события в состояниях
  changeEvent(stateId: string, event: EventSelection, newValue: Event | Action, canUndo = true) {
    const state = this.states.get(stateId);
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.view.app.model.changeEventAction(stateId, event, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEventAction',
          args: { stateId, event, newValue, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx].trigger;

      this.view.app.model.changeEvent(stateId, eventIdx, newValue);

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
    const state = this.states.get(stateId);
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      // Проверяем если действие в событие последнее то надо удалить всё событие
      if (state.data.events[eventIdx].do.length === 1) {
        return this.deleteEvent(stateId, { eventIdx, actionIdx: null });
      }

      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.view.app.model.deleteEventAction(stateId, event);

      if (canUndo) {
        this.history.do({
          type: 'deleteEventAction',
          args: { stateId, event, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx];

      this.view.app.model.deleteEvent(stateId, eventIdx);

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

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (state: State) => {
    this.emit('mouseUpOnState', state);
  };

  handleStateClick = (state: State, e: { event: MyMouseEvent }) => {
    const drawBounds = state.drawBounds;
    const titleHeight = state.titleHeight;
    const y = e.event.y - drawBounds.y;
    const x = e.event.x - drawBounds.x;

    if (y <= titleHeight && x >= drawBounds.width - 25 / this.view.app.model.data.scale) {
      this.emit('changeStateName', state);
    }
  };

  handleStateMouseDown = (state: State, e: { event: MyMouseEvent }) => {
    this.view.controller.selectState(state.id);

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
    this.view.controller.selectState(state.id);

    const eventIdx = state.eventBox.handleClick({
      x: e.event.x,
      y: e.event.y,
    });

    const offset = this.view.app.mouse.getOffset();

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
    if (typeof state.parent === 'undefined') return;

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

  handleDragEnd = (
    state: State | InitialState,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    if (this.dragInfo && state instanceof State) {
      this.linkState(this.dragInfo.parentId, this.dragInfo.childId);
      this.dragInfo = null;
      return;
    }

    this.changeStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  };

  watch(state: State | InitialState) {
    if (state instanceof State) {
      return this.watchState(state);
    }

    this.watchInitialState(state);
  }

  unwatch(state: State | InitialState) {
    if (state instanceof State) {
      return this.unwatchState(state);
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

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
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
    state.on('dragend', this.handleDragEnd.bind(this, state));
  }
  private unwatchInitialState(state: InitialState) {
    state.off('dragend', this.handleDragEnd.bind(this, state));
  }
}