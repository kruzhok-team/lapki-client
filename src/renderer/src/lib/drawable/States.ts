import { Point } from '@renderer/types/graphics';

import { EventSelection } from './Events';
import { State } from './State';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';

type CreateNameCallback = (state: State) => void;
type CreateCallback = (state: State) => void;
type MenuCallback = (state: State, pos: Point) => void;
type CreateEventCallback = (state: State, events: EventSelection, click: boolean) => void;
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
  changeEventCallback!: CreateEventCallback;
  menuEventCallback!: MenuEventCallback;
  menuCallback!: MenuCallback;

  onStateCreate = (callback: CreateCallback) => {
    this.createCallback = callback;
  };

  onStateNameCreate = (nameCallback: CreateNameCallback) => {
    this.createNameCallback = nameCallback;
  };

  onStateEventChange = (eventCallback: CreateEventCallback) => {
    this.changeEventCallback = eventCallback;
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
    const titleHeight = e.target.computedTitleSizes.height;
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
        this.changeEventCallback?.(e.target, eventIdx, true);
      }
    }
  };

  handleContextMenu = (e: { target: State; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.container.machine.removeSelection();
    e.target.setIsSelected(true);

    const eventIdx = e.target.eventBox.handleClick({ x: e.event.x, y: e.event.y });
    if (!eventIdx) {
      this.menuCallback?.(e.target, { x: e.event.x, y: e.event.y });
    } else {
      this.menuEventCallback?.(e.target, { x: e.event.x, y: e.event.y }, eventIdx);
    }
  };

  handleLongPress = (e: { target: State; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    // если состояние вложено – отсоединяем
    if (typeof e.target.parent !== 'undefined') {
      this.container.machine.unlinkState(e.target.id!);
      return;
    }

    // если под курсором есть состояние – присоединить к нему
    this.container.machine.linkStateByPoint(e.target, e.event);
    // TODO: визуальная обратная связь
  };

  handleDragEnd = (e: { target: State; dragStartPosition: Point; dragEndPosition: Point }) => {
    this.container.machine.changeStatePosition(e.target.id, e.dragStartPosition, e.dragEndPosition);
  };

  watchState(state: State) {
    state.on('mouseup', this.handleMouseUpOnState);
    state.on('click', this.handleStateClick);
    state.on('dblclick', this.handleStateDoubleClick);
    state.on('contextmenu', this.handleContextMenu);
    state.on('longpress', this.handleLongPress);
    state.on('dragend', this.handleDragEnd);

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: State) {
    state.off('mouseup', this.handleMouseUpOnState);
    state.off('click', this.handleStateClick);
    state.off('dblclick', this.handleStateDoubleClick);
    state.off('contextmenu', this.handleContextMenu);
    state.off('longpress', this.handleLongPress);
    state.off('dragend', this.handleDragEnd);

    state.edgeHandlers.unbindEvents();
    state.unbindEvents();
  }
}
