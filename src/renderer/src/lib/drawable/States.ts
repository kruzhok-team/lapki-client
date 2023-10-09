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

type DragInfo = {
  parentId: string;
  childId: string;
} | null;

/**
 * Контроллер {@link State|состояний}.
 * Предоставляет подписку на события, связанные с состояниями.
 * Реализует отрисовку и обработку выделения состояний.
 */
export class States extends EventEmitter {
  container!: Container;
  dragInfo: DragInfo = null;

  constructor(container: Container) {
    super();
    this.container = container;
  }

  // TODO Переделать это на EventEmitter
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

  handleDrag = (e: { event: MyMouseEvent; target: State }) => {
    const { target: state } = e;
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

  handleDragEnd = (e: { target: State; dragStartPosition: Point; dragEndPosition: Point }) => {
    if (this.dragInfo) {
      this.container.machine.linkState(this.dragInfo.parentId, this.dragInfo.childId);
      this.dragInfo = null;
      return;
    }

    this.container.machine.changeStatePosition(e.target.id, e.dragStartPosition, e.dragEndPosition);
  };

  watchState(state: State) {
    state.on('mouseup', this.handleMouseUpOnState as any);
    state.on('click', this.handleStateClick as any);
    state.on('dblclick', this.handleStateDoubleClick as any);
    state.on('contextmenu', this.handleContextMenu as any);
    state.on('longpress', this.handleLongPress as any);
    state.on('dragend', this.handleDragEnd as any);
    state.on('drag', this.handleDrag as any);

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }

  unwatchState(state: State) {
    state.off('mouseup', this.handleMouseUpOnState as any);
    state.off('click', this.handleStateClick as any);
    state.off('dblclick', this.handleStateDoubleClick as any);
    state.off('contextmenu', this.handleContextMenu as any);
    state.off('longpress', this.handleLongPress as any);
    state.off('dragend', this.handleDragEnd as any);
    state.off('drag', this.handleDrag as any);

    state.edgeHandlers.unbindEvents();
    state.unbindEvents();
  }
}
