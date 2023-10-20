import { Point } from '@renderer/types/graphics';

import { Condition } from './Condition';
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
  transitionContextMenu: { condition: Condition; position: Point };
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
    document.addEventListener('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);

    this.container.states.on('startNewTransition', this.handleStartNewTransition);
    this.container.states.on('mouseUpOnState', this.handleMouseUpOnState);
  }

  handleStartNewTransition = (state: State) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (condition: Condition, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.container.machine.selectTransition(condition.transition.id);
  };

  handleConditionDoubleClick = (condition: Condition, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();
    this.emit('changeTransition', condition.transition);
  };

  handleContextMenu = (condition: Condition, e: { event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.container.machine.removeSelection();
    condition.setIsSelected(true);

    this.emit('transitionContextMenu', { condition, position: { x: e.event.x, y: e.event.y } });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.isDirty = true;
  };

  handleMouseUpOnState = (state: State) => {
    this.container.machine.removeSelection();

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
    condition: Condition,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.container.machine.changeTransitionPosition(
      condition.id,
      e.dragStartPosition,
      e.dragEndPosition
    );
  };

  watchTransition(transition: Transition) {
    const condition = transition.condition;
    //Если клик был на блок transition, то он выполняет функции
    condition.on('click', this.handleConditionClick.bind(this, condition));
    //Если клик был на блок transition, то он выполняет функции
    condition.on('dblclick', this.handleConditionDoubleClick.bind(this, condition));
    //Если клик был за пределами блока transition, то он выполняет функции
    // condition.on('mouseup', this.handleMouseUpOnState.bind(this, condition));

    condition.on('contextmenu', this.handleContextMenu.bind(this, condition));
    condition.on('dragend', this.handleDragEnd.bind(this, condition));
  }

  unwatchTransition(transition: Transition) {
    const condition = transition.condition;

    condition.off('click', this.handleConditionClick.bind(this, condition));
    condition.off('dblclick', this.handleConditionDoubleClick.bind(this, condition));
    // condition.off('mouseup', this.handleMouseUpOnState.bind(this, condition));
    condition.off('contextmenu', this.handleContextMenu.bind(this, condition));
    condition.off('dragend', this.handleDragEnd.bind(this, condition));
    condition.unbindEvents();
  }
}
