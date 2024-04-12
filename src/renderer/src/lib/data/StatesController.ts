import throttle from 'lodash.throttle';

import { State } from '@renderer/lib/drawable/Node/State';
import { ChangeStateEventsParams, CreateStateParams } from '@renderer/lib/types/EditorManager';
import { Point } from '@renderer/lib/types/graphics';
import { UnlinkStateParams } from '@renderer/lib/types/MachineController';
import { Action, Event, EventData } from '@renderer/types/diagram';
import { MyMouseEvent } from '@renderer/types/mouse';

import { History } from './History';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { EventSelection } from '../drawable/Events';
import { BaseState } from '../drawable/Node/BaseState';
import { InitialState } from '../drawable/Node/InitialState';
import { Layer } from '../types';

type DragHandler = (state: State, e: { event: MyMouseEvent }) => void;

type DragInfo = {
  parentId: string;
  childId: string;
} | null;

/**
 * Контроллер {@link State|состояний}.
 * Предоставляет подписку на события, связанные с состояниями.
 */
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

export class StatesController extends EventEmitter<StatesControllerEvents> {
  dragInfo: DragInfo = null;
  // initialStateMark: InitialState | null = null;

  private items: Map<string, BaseState> = new Map();

  constructor(private container: Container, private history: History) {
    super();
  }

  getNormalStates() {
    return new Map([...this.items.entries()].filter(([, state]) => state instanceof State)) as Map<
      string,
      State
    >;
  }

  get(id: string) {
    return this.items.get(id);
  }

  forEach(callback: (state: BaseState) => void) {
    return this.items.forEach(callback);
  }

  forEachNormalStates(callback: (state: State) => void) {
    return this.items.forEach((state) => {
      if (state instanceof State) {
        callback(state);
      }
    });
  }

  clear() {
    return this.items.clear();
  }

  set(id: string, state: BaseState) {
    return this.items.set(id, state);
  }

  // TODO
  get transitions() {
    return this.container.machineController.transitions;
  }

  createState = (args: CreateStateParams, canUndo = true) => {
    const { parentId, position, linkByPoint = true } = args;

    // Создание данных
    const newStateId = this.container.app.manager.createState(args);
    // Создание вьюшки
    const state = new State(this.container, newStateId);

    this.items.set(state.id, state);

    let numberOfConnectedActions = 0;

    // вкладываем состояние, если оно создано над другим
    if (parentId) {
      this.linkState(parentId, newStateId, canUndo);
      numberOfConnectedActions += 1;
    } else {
      this.container.children.add(state, Layer.NormalStates);
      if (linkByPoint) {
        this.linkStateByPoint(state, position);
      }
    }

    // Если не было начального состояния, им станет новое
    if ((state.parent || this.container).children.layers[Layer.NormalStates].length === 1) {
      this.createInitialState(state, canUndo);
      // numberOfConnectedActions += 1;
      // state.parent.children.layers[Layer.NormalStates].add(state, Layer.NormalStates);
    }

    // TODO
    // if (!this.container.app.manager.data.elements.initialState) {
    //   this.setInitialState(state.id, canUndo);
    //   numberOfConnectedActions += 1;
    // }

    this.watchState(state);

    this.container.isDirty = true;

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

    const state = this.items.get(id);
    if (!state || !(state instanceof State)) return;

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

    this.container.app.manager.changeStateEvents(args);

    state.updateEventBox();

    this.container.isDirty = true;
  }

  changeStateName = (id: string, name: string, canUndo = true) => {
    const state = this.items.get(id);
    if (!state || !(state instanceof State)) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStateName',
        args: { id, name, prevName: state.data.name },
      });
    }

    this.container.app.manager.changeStateName(id, name);

    this.container.isDirty = true;
  };

  changeStatePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const state = this.items.get(id);
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStatePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.container.app.manager.changeStatePosition(id, endPosition);

    this.container.isDirty = true;
  }

  linkState(parentId: string, childId: string, canUndo = true, addOnceOff = false) {
    const parent = this.items.get(parentId);
    const child = this.items.get(childId);

    if (!parent || !child || !(parent instanceof State) || !(child instanceof State)) return;

    let numberOfConnectedActions = 0;
    if (child.data.parentId) {
      this.unlinkState({ id: childId }, canUndo);
      numberOfConnectedActions += 1;
    }

    // Вычисляем новую координату внутри контейнера
    const parentPos = parent.compoundPosition;
    const childPos = child.compoundPosition;
    const newPosition = {
      x: Math.max(0, childPos.x - parentPos.x),
      y: Math.max(0, childPos.y - parentPos.y - parent.dimensions.height),
    };

    this.container.app.manager.linkState(parentId, childId);
    this.changeStatePosition(childId, child.position, newPosition, false);
    // this.container.app.manager.changeStateBounds(childId, newBounds);

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

    (child.parent || this.container).children.remove(child, Layer.NormalStates);
    child.parent = parent;
    parent.children.add(child, Layer.NormalStates);

    // Если не было начального состояния, им станет новое
    if (child.parent.children.layers[Layer.NormalStates].length === 1) {
      this.createInitialState(child, canUndo);
      // numberOfConnectedActions += 1;
      // state.parent.children.layers[Layer.NormalStates].add(state, Layer.NormalStates);
    }

    console.log(this.container);
    console.log(parent);

    // TODO Сделать удобный проход по переходам состояния
    this.transitions.forEach((transition) => {
      if (transition.source.id === child.id || transition.target.id === child.id) {
        this.container.machineController.transitions.linkTransition(transition.id);
      }
    });

    // console.log(parent, child);
    // console.log(this.container.children);

    this.container.isDirty = true;
  }

  // TODO
  linkStateByPoint(_state: State, _position: Point) {
    // TODO
    // назначаем родительское состояние по месту его создания
    // let possibleParent: State | undefined = undefined;
    // for (const item of this.states.values()) {
    //   if (state.id == item.id) continue;
    //   if (item.isUnderMouse(position, true)) {
    //     if (typeof possibleParent === 'undefined') {
    //       possibleParent = item;
    //     } else {
    //       // учитываем вложенность, нужно поместить состояние
    //       // в максимально дочернее
    //       let searchPending = true;
    //       while (searchPending) {
    //         searchPending = false;
    //         for (const child of possibleParent.children) {
    //           if (!(child instanceof State)) continue;
    //           if (state.id == child.id) continue;
    //           if (child.isUnderMouse(position, true)) {
    //             possibleParent = child as State;
    //             searchPending = true;
    //             break;
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
    // if (possibleParent !== state && possibleParent) {
    //   this.linkState(possibleParent.id, state.id, true, true);
    // }
  }

  unlinkState(params: UnlinkStateParams, canUndo = true) {
    const { id } = params;

    const state = this.items.get(id);
    if (!state || !state.parent) return;

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newPosition = { ...state.compoundPosition };
    this.changeStatePosition(id, state.position, newPosition, canUndo);
    // this.container.app.manager.changeStateBounds(id, newBounds);

    if (canUndo) {
      this.history.do({
        type: 'unlinkState',
        args: { parentId: state.parent.id, params },
        numberOfConnectedActions: 1, // Изменение позиции
      });
      state.addOnceOff('dragend');
    }

    this.container.app.manager.unlinkState(id);

    state.parent.children.remove(state, Layer.NormalStates);
    const parentTransitionIds = this.container.machineController.transitions.getIdsByStateId(
      state.parent.id
    );
    state.parent.children.clear(Layer.Transitions);
    state.parent = undefined;
    parentTransitionIds.forEach(this.container.machineController.transitions.linkTransition);
    this.container.children.add(state, Layer.NormalStates);

    this.container.isDirty = true;
  }

  deleteState = (id: string, canUndo = true) => {
    const state = this.items.get(id);
    if (!state || !(state instanceof State)) return;

    const parentId = state.data.parentId;
    const numberOfConnectedActions = 0;

    // Удаляем зависимые события, нужно это делать тут а нет в данных потому что модели тоже должны быть удалены и события на них должны быть отвязаны
    this.container.machineController.transitions.forEach((transition) => {
      if (transition.source.id === id || transition.target.id === id) {
        this.container.machineController.transitions.deleteTransition(transition.id, canUndo);
        // numberOfConnectedActions += 1;
      }
    });

    // Ищем дочерние состояния и отвязываем их от текущего, делать это нужно тут потому что поле children есть только в модели и его нужно поменять
    this.items.forEach((childState) => {
      if (childState.data.parentId === id) {
        // Если есть родительское, перепривязываем к нему
        if (state.data.parentId) {
          this.linkState(state.data.parentId, childState.id, canUndo);
        } else {
          this.unlinkState({ id: childState.id }, canUndo);
        }
        // numberOfConnectedActions += 1;
      }
    });

    // Отсоединяемся от родительского состояния, если такое есть.
    (state.parent || this.container).children.remove(state, Layer.NormalStates);

    // Если удаляемое состояние было начальным, стираем текущее значение
    // TODO
    // if (this.container.app.manager.data.elements.initialState?.target === id) {
    //   this.removeInitialState(id, canUndo);
    //   numberOfConnectedActions += 1;
    // }

    if (canUndo) {
      this.history.do({
        type: 'deleteState',
        args: { id, stateData: { ...structuredClone(state.data), parentId } },
        numberOfConnectedActions,
      });
    }

    this.container.app.manager.deleteState(id);

    this.unwatchState(state);
    this.items.delete(id);

    this.container.isDirty = true;
  };

  private createInitialState = (target: State, _canUndo = true) => {
    const newStateId = this.container.app.manager.createInitialState({
      position: { x: target.position.x - 100, y: target.position.y - 100 },
      parentId: target.data.parentId,
    });

    const state = new InitialState(this.container, newStateId);

    this.items.set(state.id, state);

    (target.parent || this.container).children.add(state, Layer.InitialStates);

    if (target.parent) {
      state.parent = target.parent;
    }

    this.container.machineController.transitions.createTransition(
      {
        color: '#FFF',
        source: state.id,
        target: target.id,
      },
      false
    );
  };

  createEvent(stateId: string, eventData: EventData, eventIdx?: number) {
    const state = this.items.get(stateId);
    if (!state || !(state instanceof State)) return;

    this.container.app.manager.createEvent(stateId, eventData, eventIdx);

    state.updateEventBox();

    this.container.isDirty = true;
  }

  createEventAction(stateId: string, event: EventSelection, value: Action) {
    const state = this.items.get(stateId);
    if (!state || !(state instanceof State)) return;

    this.container.app.manager.createEventAction(stateId, event, value);

    state.updateEventBox();

    this.container.isDirty = true;
  }

  // Редактирование события в состояниях
  changeEvent(stateId: string, event: EventSelection, newValue: Event | Action, canUndo = true) {
    const state = this.items.get(stateId);
    if (!state || !(state instanceof State)) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.container.app.manager.changeEventAction(stateId, event, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEventAction',
          args: { stateId, event, newValue, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx].trigger;

      this.container.app.manager.changeEvent(stateId, eventIdx, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEvent',
          args: { stateId, event, newValue, prevValue },
        });
      }
    }

    state.updateEventBox();

    this.container.isDirty = true;
  }

  // Удаление события в состояниях
  //TODO показывать предупреждение при удалении события в состоянии(модалка)
  deleteEvent(stateId: string, event: EventSelection, canUndo = true) {
    const state = this.items.get(stateId);
    if (!state || !(state instanceof State)) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      // Проверяем если действие в событие последнее то надо удалить всё событие
      if (state.data.events[eventIdx].do.length === 1) {
        return this.deleteEvent(stateId, { eventIdx, actionIdx: null });
      }

      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.container.app.manager.deleteEventAction(stateId, event);

      if (canUndo) {
        this.history.do({
          type: 'deleteEventAction',
          args: { stateId, event, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx];

      this.container.app.manager.deleteEvent(stateId, eventIdx);

      if (canUndo) {
        this.history.do({
          type: 'deleteEvent',
          args: { stateId, eventIdx, prevValue },
        });
      }
    }

    state.updateEventBox();

    this.container.isDirty = true;
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

    if (y <= titleHeight && x >= drawBounds.width - 25 / this.container.app.manager.data.scale) {
      this.emit('changeStateName', state);
    }
  };

  handleStateMouseDown = (state: State, e: { event: MyMouseEvent }) => {
    this.container.machineController.selectState(state.id);

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
    this.container.machineController.selectState(state.id);

    const eventIdx = state.eventBox.handleClick({
      x: e.event.x,
      y: e.event.y,
    });

    const offset = this.container.app.mouse.getOffset();

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
    const possibleParent = (state.parent ?? this.container).getCapturedNode({
      position: e.event,
      exclude: [state],
      includeChildrenHeight: false,
      layer: Layer.NormalStates,
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
    if (this.dragInfo) {
      this.linkState(this.dragInfo.parentId, this.dragInfo.childId);
      this.dragInfo = null;
      return;
    }

    this.changeStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  };

  // handleInitialStateDragEnd = (e: { dragStartPosition: Point; dragEndPosition: Point }) => {
  //   this.container.machineController.changeInitialStatePosition(
  //     e.dragStartPosition,
  //     e.dragEndPosition
  //   );
  // };

  watchState(state: BaseState) {
    if (!(state instanceof State)) return;

    state.on('click', this.handleStateClick.bind(this, state));
    state.on('mousedown', this.handleStateMouseDown.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.on('contextmenu', this.handleContextMenu.bind(this, state));
    state.on('drag', this.handleDrag.bind(this, state));
    state.on('dragend', this.handleDragEnd.bind(this, state));
    state.on('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: BaseState) {
    if (!(state instanceof State)) return;

    state.off('click', this.handleStateClick.bind(this, state));
    state.off('mousedown', this.handleStateMouseDown.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.off('contextmenu', this.handleContextMenu.bind(this, state));
    state.off('drag', this.handleDrag.bind(this, state));
    state.off('dragend', this.handleDragEnd.bind(this, state));
    state.off('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.unbindEvents();
  }

  // private watchInitialState() {
  //   this.initialStateMark?.on('dragend', this.handleInitialStateDragEnd.bind(this));
  // }

  // private unwatchInitialState() {
  //   this.initialStateMark?.off('dragend', this.handleInitialStateDragEnd.bind(this));
  // }

  // clearInitialStateMark() {
  // this.unwatchInitialState();
  // this.initialStateMark = null;
  // }

  // initInitialStateMark() {
  // this.unwatchInitialState();
  // this.initialStateMark = new InitialState(this.container);
  // this.watchInitialState();
  // }
}
