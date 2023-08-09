import { State } from './State';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { Point } from '@renderer/types/graphics';
import { EventSelection } from './Events';

type CreateNameCallback = (state: State) => void;
type CreateCallback = (state: State) => void;
type MenuCallback = (state: State, pos: Point) => void;
type CreateEventCallback = (state: State, events: EventSelection) => void;
type MenuEventCallback = (state: State, position: Point, events: EventSelection) => void;

/**
 * Контроллер {@link State|состояний}.
 * Предоставляет подписку на события, связанные с состояниями.
 * Реализует отрисовку и обработку выделения состояний.
 */
export class States extends EventEmitter {
  container!: Container;

  constructor(container: Container) {
    super();
    this.container = container;
  }

  createCallback!: CreateCallback;
  createNameCallback!: CreateNameCallback;
  createEventCallback!: CreateEventCallback;
  menuEventCallback!: MenuEventCallback;
  menuCallback!: MenuCallback;

  onStateCreate = (callback: CreateCallback) => {
    this.createCallback = callback;
  };

  onStateNameCreate = (nameCallback: CreateNameCallback) => {
    this.createNameCallback = nameCallback;
  };

  onStateEventCreate = (eventCallback: CreateEventCallback) => {
    this.createEventCallback = eventCallback;
  };

  onStateContextMenu = (menuCallback: MenuCallback) => {
    this.menuCallback = menuCallback;
  };

  onEventContextMenu = (menuEventCallback: MenuEventCallback) => {
    this.menuEventCallback = menuEventCallback;
  };

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.container.machine.states.forEach((state) => {
      state.draw(ctx, canvas);
    });
  }

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (e: { target: State; event: MyMouseEvent }) => {
    this.emit('mouseUpOnState', e);
  };

  handleStateClick = (e: { target: State; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.container.machine.removeSelection();
    e.target.setIsSelected(true);

    const targetPos = e.target.computedPosition;
    const titleHeight = e.target.titleHeight;
    const y = e.event.y - targetPos.y;
    // FIXME: если будет учёт нажатий на дочерний контейнер, нужно отсеять их здесь
    if (y > titleHeight) {
      // FIXME: пересчитывает координаты внутри, ещё раз
      e.target.eventBox.handleClick({ x: e.event.x, y: e.event.y });
    }
  };

  handleStateDoubleClick = (e: { target: State; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    const targetPos = e.target.computedPosition;
    const titleHeight = e.target.titleHeight;
    const y = e.event.y - targetPos.y;
    if (y <= titleHeight) {
      this.createNameCallback?.(e.target);
    } else {
      // FIXME: если будет учёт нажатий на дочерний контейнер, нужно отсеять их здесь
      // FIXME: пересчитывает координаты внутри, ещё раз
      const eventIdx = e.target.eventBox.handleDoubleClick({ x: e.event.x, y: e.event.y });
      if (!eventIdx) {
        this.createCallback?.(e.target);
      } else {
        this.createEventCallback?.(e.target, eventIdx);
      }
    }
    this.container.machine.dataTrigger(true);
  };

  handleContextMenu = (e: { target: State; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    const eventIdx = e.target.eventBox.handleClick({ x: e.event.x, y: e.event.y });
    if (!eventIdx) {
      this.menuCallback?.(e.target, { x: e.event.x, y: e.event.y });
    } else {
      this.menuEventCallback?.(e.target, { x: e.event.x + 250, y: e.event.y + 50 }, eventIdx);
    }
  };

  handleLongPress = (e: { target: State; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    if (typeof e.target.parent !== 'undefined') {
      this.container.machine.unlinkState(e.target.id!);
    }

    this.container.machine.newСhildrenState(e.target, e.event);

    // TODO: если под курсором есть состояние – присоединить к нему
    // TODO: визуальная обратная связь
  };

  watchState(state: State) {
    state.on('mouseup', this.handleMouseUpOnState as any);
    state.on('click', this.handleStateClick as any);
    state.on('dblclick', this.handleStateDoubleClick as any);
    state.on('contextmenu', this.handleContextMenu as any);
    state.on('longpress', this.handleLongPress as any);

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: State) {
    state.off('mouseup', this.handleMouseUpOnState as any);
    state.off('click', this.handleStateClick as any);
    state.off('dblclick', this.handleStateDoubleClick as any);
    state.off('contextmenu', this.handleContextMenu as any);
    state.off('longpress', this.handleLongPress as any);

    state.edgeHandlers.unbindEvents();
    state.unbindEvents();
  }
}
