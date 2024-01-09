import { Point } from '@renderer/types/graphics';
import { MyMouseEvent } from '@renderer/types/mouse';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { GhostTransition } from '../drawable/GhostTransition';
import { State } from '../drawable/State';
import { Transition } from '../drawable/Transition';

/**
 * Контроллер {@link Transition|переходов}.
 * Обрабатывает события, связанные с переходами.
 * Отрисовывает {@link GhostTransition|«призрачный» переход}.
 */

interface TransitionsControllerEvents {
  createTransition: { source: State; target: State };
  changeTransition: Transition;
  transitionContextMenu: { transition: Transition; position: Point };
}

export class TransitionsController extends EventEmitter<TransitionsControllerEvents> {
  ghost!: GhostTransition;

  constructor(public container: Container) {
    super();

    this.ghost = new GhostTransition(container);
  }

  initEvents() {
    this.container.app.mouse.on('mousemove', this.handleMouseMove);

    this.container.statesController.on('startNewTransition', this.handleStartNewTransition);
    this.container.statesController.on('mouseUpOnState', this.handleMouseUpOnState);
  }

  handleStartNewTransition = (state: State) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (transition: Transition) => {
    this.container.machineController.selectTransition(transition.id);
  };

  handleConditionDoubleClick = (transition: Transition) => {
    this.emit('changeTransition', transition);
  };

  handleContextMenu = (transition: Transition, e: { event: MyMouseEvent }) => {
    this.container.machineController.removeSelection();
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
    this.container.isDirty = true;
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
    this.container.machineController.changeTransitionPosition(
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
