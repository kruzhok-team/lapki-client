import { Point } from '@renderer/types/graphics';

import { EventSelection } from './Events';
import { InitialStateMark } from './InitialStateMark';
import { State } from './State';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';

type DragInfo = {
  parentId: string;
  childId: string;
} | null;

/**
 * Контроллер {@link State|состояний}.
 * Предоставляет подписку на события, связанные с состояниями.
 * Реализует отрисовку и обработку выделения состояний.
 */
interface StatesEvents {
  mouseUpOnState: State;
  startNewTransition: State;
  changeState: State;
  changeStateName: State;
  stateContextMenu: { state: State; position: Point };
  changeEvent: { state: State; event: EventSelection; click: boolean };
  eventContextMenu: { state: State; event: EventSelection; position: Point };
}

export class States extends EventEmitter<StatesEvents> {
  dragInfo: DragInfo = null;
  initialStateMark: InitialStateMark | null = null;

  constructor(public container: Container) {
    super();
    this.container = container;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.container.machine.states.forEach((state) => {
      state.draw(ctx, canvas);
    });

    this.initialStateMark?.draw(ctx);
  }

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (state: State) => {
    this.emit('mouseUpOnState', state);
  };

  handleStateClick = (state: State, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.container.machine.removeSelection();
    state.setIsSelected(true);

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
    e.event.stopPropagation();

    const targetPos = state.computedPosition;
    const titleHeight = state.computedTitleSizes.height;
    const y = e.event.y - targetPos.y;
    if (y <= titleHeight) {
      this.emit('changeStateName', state);
    } else {
      // FIXME: если будет учёт нажатий на дочерний контейнер, нужно отсеять их здесь
      // FIXME: пересчитывает координаты внутри, ещё раз
      const eventIdx = state.eventBox.handleDoubleClick({ x: e.event.x, y: e.event.y });
      if (!eventIdx) {
        this.emit('changeState', state);
      } else {
        this.emit('changeEvent', { state, event: eventIdx, click: true });
      }
    }
  };

  handleContextMenu = (state: State, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.container.machine.removeSelection();
    state.setIsSelected(true);

    const eventIdx = state.eventBox.handleClick({ x: e.event.x, y: e.event.y });
    if (!eventIdx) {
      this.emit('stateContextMenu', { state, position: { x: e.event.x, y: e.event.y } });
    } else {
      this.emit('eventContextMenu', {
        state,
        position: { x: e.event.x, y: e.event.y },
        event: eventIdx,
      });
    }
  };

  handleDrag = (state: State, e: { event: MyMouseEvent }) => {
    const position = { x: e.event.x, y: e.event.y };

    // Чтобы проверять начиная со своего уровня вложенности
    const dragOverStates = (
      state.parent ? state.parent.children : this.container.machine.states
    ) as Map<string, State>;

    let possibleParent: State | undefined = undefined;
    for (const item of dragOverStates.values()) {
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
            for (const child of possibleParent.children.values()) {
              if (!(child instanceof State)) continue;
              if (state.id == child.id) continue;
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

    this.dragInfo = null;

    if (possibleParent) {
      this.dragInfo = {
        parentId: possibleParent.id,
        childId: state.id,
      };
    }
  };

  handleDragEnd = (state: State, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    if (this.dragInfo) {
      this.container.machine.linkState(this.dragInfo.parentId, this.dragInfo.childId);
      this.dragInfo = null;
      return;
    }

    this.container.machine.changeStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  };

  // если состояние вложено – отсоединяем
  handleLongPress = (state: State, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();

    if (typeof state.parent === 'undefined') return;

    this.container.machine.unlinkState(state.id);
  };

  watchState(state: State) {
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('click', this.handleStateClick.bind(this, state));
    state.on('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.on('contextmenu', this.handleContextMenu.bind(this, state));
    state.on('drag', this.handleDrag.bind(this, state));
    state.on('dragend', this.handleDragEnd.bind(this, state));
    state.on('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: State) {
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('click', this.handleStateClick.bind(this, state));
    state.off('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.off('contextmenu', this.handleContextMenu.bind(this, state));
    state.off('drag', this.handleDrag.bind(this, state));
    state.off('dragend', this.handleDragEnd.bind(this, state));
    state.off('longpress', this.handleLongPress.bind(this, state));

    state.edgeHandlers.unbindEvents();
    state.unbindEvents();
  }

  initInitialStateMark(stateId: string) {
    this.initialStateMark = new InitialStateMark(this.container, stateId);
  }
}
