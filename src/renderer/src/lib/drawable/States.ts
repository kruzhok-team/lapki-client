import { State } from './State';

import { Elements } from '@renderer/types/diagram';
import { EventEmitter } from '../common/EventEmitter';
import { Point } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';

type CreateStateCallback = (state) => void;

export class States extends EventEmitter {
  container!: Container;

  items: Map<string, State> = new Map();
  constructor(container: Container) {
    super();
    this.container = container;
  }

  createCallback?: CreateStateCallback;

  initEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
  }
  
  initItems(items: Elements['states'], initialState: string) {
    for (const id in items) {
      const parent = this.items.get(items[id].parent ?? '');
      const state = new State({
        container: this.container,
        id: id,
        data: items[id],
        parent,
        initial: id === initialState,
      });

      parent?.children.set(id, state);
      state.on('dblclick', this.handleStateDoubleClick as any);
      state.on('mouseup', this.handleMouseUpOnState as any);
      state.on('click', this.handleStateClick as any);

      state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;

      this.items.set(id, state);
    }
  }

  onStateCreate = (callback: CreateStateCallback) => {
    this.createCallback = callback;
  };

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });
  }

  private removeSelection() {
    this.items.forEach((state) => state.setIsSelected(false));
  }

  handleMouseUp = () => {
    this.removeSelection();

    this.container.app.isDirty = true;
  };

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (e: { target: State; event: any }) => {
    this.emit('mouseUpOnState', e);
  };

  handleStateClick = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();

    this.removeSelection();

    target.setIsSelected(true);
    this.container.app.isDirty = true;
  };

  handleStateDoubleClick = (e: { target: State; event: any }) => {
    e.event.stopPropagation();
    console.log("double click);
    console.log(e.target);
    this.createCallback?.(e);
  };

  createState(name: string, events: string, component: string, method: string) {
    const { width, height } = stateStyle;
    const x = 100 - width / 2;
    const y = 100 - height / 2;

    var startEvents = {};
    startEvents[events] = { component, method };

    const state = new State({
      container: this.container,
      id: name,
      data: {
        bounds: { x, y, width, height },
        events: startEvents,
      },
    });

    state.on('dblclick', this.handleStateDoubleClick as any);
    state.on('click', this.handleStateClick as any);
    state.on('mouseup', this.handleMouseUpOnState as any);
    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;

    this.items.set(name, state);

    this.container.app.isDirty = true;
  }

  createNewState(name: string, position: Point) {
    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;

    const state = new State({
      container: this.container,
      id: name,
      data: {
        bounds: { x, y, width, height },
        events: {},
      },
    });

    state.on('dblclick', this.handleStateDoubleClick as any);
    state.on('click', this.handleStateClick as any);
    state.on('mouseup', this.handleMouseUpOnState as any);
    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;

    this.items.set(name, state);

    this.container.app.isDirty = true;
  }
}
