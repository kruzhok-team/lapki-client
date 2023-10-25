import { Point } from '@renderer/types/graphics';

import { GhostTransition } from './GhostTransition';
import { State } from './State';
import { Transition } from './Transition';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';

/**
 * Контроллер {@link Transition|переходов}.
 * Обрабатывает события, связанные с переходами.
 * Отрисовывает переходы, в том числе {@link GhostTransition|«призрачный» переход}.
 */

interface TransitionsEvents {
  createTransition: { source: State; target: State };
  changeTransition: Transition;
  transitionContextMenu: { transition: Transition; position: Point };
}

export class Transitions extends EventEmitter<TransitionsEvents> {
  container!: Container;

  ghost!: GhostTransition;

  constructor(container: Container) {
    super();

    this.container = container;
    this.ghost = new GhostTransition(container);
  }

  initEvents() {
    this.container.app.mouse.on('mousemove', this.handleMouseMove);

    this.container.states.on('startNewTransition', this.handleStartNewTransition);
    this.container.states.on('mouseUpOnState', this.handleMouseUpOnState);
  }

  handleStartNewTransition = (state: State) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (transition: Transition) => {
    this.container.machine.selectTransition(transition.id);
  };

  handleConditionDoubleClick = (transition: Transition) => {
    this.emit('changeTransition', transition);
  };

  handleContextMenu = (transition: Transition, e: { event: MyMouseEvent }) => {
    this.container.machine.removeSelection();
    transition.setIsSelected(true);

    this.emit('transitionContextMenu', { transition, position: { x: e.event.x, y: e.event.y } });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.isDirty = true;
  };

  handleMouseUpOnState = (state: State) => {
    if (!this.ghost.source) return;
    // Переход создаётся только на другое состояние
    // FIXME: вызывать создание внутреннего события при перетаскивании на себя?
    if (state !== this.ghost.source) {
      this.emit('createTransition', { source: this.ghost.source, target: state });
    }
    this.ghost.clear();
  };

  handleMouseUp = () => {
    if (!this.ghost.source) return;
    this.ghost.clear();
    this.container.isDirty = true;
  };

  handleDragEnd = (
    transition: Transition,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.container.machine.changeTransitionPosition(
      transition.id,
      e.dragStartPosition,
      e.dragEndPosition
    );
  };

  watchTransition(transition: Transition) {
    transition.on('click', this.handleConditionClick.bind(this, transition));
    transition.on('dblclick', this.handleConditionDoubleClick.bind(this, transition));
    transition.on('contextmenu', this.handleContextMenu.bind(this, transition));
    transition.on('dragend', this.handleDragEnd.bind(this, transition));
  }

  unwatchTransition(transition: Transition) {
    transition.off('click', this.handleConditionClick.bind(this, transition));
    transition.off('dblclick', this.handleConditionDoubleClick.bind(this, transition));
    transition.off('contextmenu', this.handleContextMenu.bind(this, transition));
    transition.off('dragend', this.handleDragEnd.bind(this, transition));
  }
}
