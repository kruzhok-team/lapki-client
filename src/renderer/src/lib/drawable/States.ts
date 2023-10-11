import { Point } from '@renderer/types/graphics';

import { EventSelection } from './Events';
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
  container!: Container;

  constructor(container: Container) {
    super();
    this.container = container;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.container.machine.states.forEach((state) => {
      state.draw(ctx, canvas);
    });
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

  handleLongPress = (state: State, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();

    // если состояние вложено – отсоединяем
    if (typeof state.parent !== 'undefined') {
      this.container.machine.unlinkState(state.id!);
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
    state.on('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.on('click', this.handleStateClick.bind(this, state));
    state.on('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.on('contextmenu', this.handleContextMenu.bind(this, state));
    state.on('longpress', this.handleLongPress.bind(this, state));
    state.on('dragend', this.handleDragEnd.bind(this, state));

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: State) {
    state.off('mouseup', this.handleMouseUpOnState.bind(this, state));
    state.off('click', this.handleStateClick.bind(this, state));
    state.off('dblclick', this.handleStateDoubleClick.bind(this, state));
    state.off('contextmenu', this.handleContextMenu.bind(this, state));
    state.off('longpress', this.handleLongPress.bind(this, state));
    state.off('dragend', this.handleDragEnd.bind(this, state));

    state.edgeHandlers.unbindEvents();
    state.unbindEvents();
  }
}
