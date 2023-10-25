import { Point } from '@renderer/types/graphics';

import { EventSelection } from './Events';
import { InitialStateMark } from './InitialStateMark';
import { State } from './State';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';

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
  initialStateMark: InitialStateMark | null = null;

  constructor(public container: Container) {
    super();
  }

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (state: State) => {
    this.emit('mouseUpOnState', state);
  };

  handleStateClick = (state: State, e: { event: MyMouseEvent }) => {
    this.container.machine.selectState(state.id);

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
      const eventIdx = state.eventBox.handleDoubleClick({ x: e.event.x, y: e.event.y });
      if (!eventIdx) {
        this.emit('changeState', state);
      } else {
        this.emit('changeEvent', { state, event: eventIdx, click: true });
      }
    }
  };

  handleContextMenu = (state: State, e: { event: MyMouseEvent }) => {
    this.container.machine.selectState(state.id);

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

  handleLongPress = (state: State, e: { event: MyMouseEvent }) => {
    // если состояние вложено – отсоединяем
    if (typeof state.parent !== 'undefined') {
      this.container.machine.unlinkState(state.id);
      return;
    }

    // если под курсором есть состояние – присоединить к нему
    this.container.machine.linkStateByPoint(state, e.event);
    // TODO: визуальная обратная связь
  };

  handleDragEnd = (state: State, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    this.container.machine.changeStatePosition(state.id, e.dragStartPosition, e.dragEndPosition);
  };

  watchState(state: State) {
    state.on('mousedown', this.handleStateClick.bind(this, state));
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.on('contextmenu', this.handleContextMenu.bind(this, state));
    state.on('longpress', this.handleLongPress.bind(this, state));
    state.on('dragend', this.handleDragEnd.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: State) {
    state.off('mousedown', this.handleStateClick.bind(this, state));
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.off('contextmenu', this.handleContextMenu.bind(this, state));
    state.off('longpress', this.handleLongPress.bind(this, state));
    state.off('dragend', this.handleDragEnd.bind(this, state));

    state.edgeHandlers.unbindEvents();
  }

  initInitialStateMark(stateId: string) {
    this.initialStateMark = new InitialStateMark(this.container, stateId);
  }
}
