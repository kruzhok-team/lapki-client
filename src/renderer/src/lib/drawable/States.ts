import { State } from './State';
import { EventEmitter } from '../common/EventEmitter';
import { Container } from '../basic/Container';

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

  createCallback!: (state) => void;
  MenuCallback!: (state) => void;

  initEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
  }

  onStateCreate = (callback: (state) => void) => {
    this.createCallback = callback;
  };

  onStateContextMenu = (Menucallback: (state) => void) => {
    this.MenuCallback = Menucallback;
  };

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.container.machine.states.forEach((state) => {
      state.draw(ctx, canvas);
    });
  }

  handleMouseUp = () => {
    this.container.machine.removeSelection();
  };

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (e: { target: State; event: any }) => {
    this.emit('mouseUpOnState', e);
  };

  handleStateClick = (e: { target: State; event: any }) => {
    e.event.stopPropagation();

    this.container.machine.removeSelection();
    e.target.setIsSelected(true, JSON.stringify(e.target));
  };

  handleStateDoubleClick = (e: { target: State; event: any }) => {
    e.event.stopPropagation();

    this.createCallback?.(e);
  };

  handleContextMenu = (e: { target: State; event: any }) => {
    e.event.stopPropagation();

    this.MenuCallback?.(e.target);

    // this.container.machine.deleteState(e.target.id);
  };

  handleLongPress = (e: { target: State }) => {
    if (typeof e.target.parent !== 'undefined') {
      this.container.machine.unlinkState(e.target.id!);
    }
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
