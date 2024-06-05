import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { DEFAULT_TRANSITION_COLOR } from '@renderer/lib/constants';
import {
  InitialState,
  Note,
  ChoiceState,
  FinalState,
  GhostTransition,
  State,
  Transition,
} from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';
import { ChangeTransitionParams, CreateTransitionParams } from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { indexOfMin } from '@renderer/lib/utils';

interface TransitionsControllerEvents {
  createTransition: {
    source: State | ChoiceState;
    target: State | ChoiceState | FinalState;
  };
  changeTransition: Transition;
  transitionContextMenu: { transition: Transition; position: Point };
}

/**
 * Контроллер {@link Transition|переходов}.
 * Обрабатывает события, связанные с переходами.
 * Отрисовывает {@link GhostTransition|«призрачный» переход}.
 */
export class TransitionsController extends EventEmitter<TransitionsControllerEvents> {
  ghost: GhostTransition | null = null;

  items: Map<string, Transition> = new Map();

  constructor(private app: CanvasEditor) {
    super();
  }

  private get view() {
    return this.app.view;
  }

  private get controller() {
    return this.app.controller;
  }

  private get history() {
    return this.app.controller.history;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  forEachByStateId(stateId: string, callback: (transition: Transition) => void) {
    return this.items.forEach((transition) => {
      if (transition.data.source === stateId || transition.data.target === stateId) {
        callback(transition);
      }
    });
  }

  forEachByTargetId(targetId: string, callback: (transition: Transition) => void) {
    return this.items.forEach((transition) => {
      if (transition.data.target === targetId) {
        callback(transition);
      }
    });
  }

  getAllByTargetId(targetId: string | string[]) {
    return [...this.items.values()].filter(({ target }) => {
      if (Array.isArray(targetId)) {
        return targetId.includes(target.id);
      }
      return targetId === target.id;
    });
  }

  getIdsByStateId(stateId: string) {
    return [...this.items.entries()]
      .filter(([, { source, target }]) => source.id === stateId || target.id === stateId)
      .map(([id]) => id);
  }

  getBySourceId(sourceId: string) {
    return [...this.items.values()].find(({ source }) => source.id === sourceId);
  }

  createTransition(params: CreateTransitionParams, canUndo = true) {
    const { source, target, color, id: prevId, label } = params;

    const sourceId = this.controller.states.get(source) || this.controller.notes.get(source);
    const targetId =
      this.controller.states.get(target) ||
      this.controller.notes.get(target) ||
      this.controller.transitions.get(target);

    if (!sourceId || !targetId) return;

    if (label && !label.position) {
      label.position = {
        x: (sourceId.position.x + targetId.position.x) / 2,
        y: (sourceId.position.y + targetId.position.y) / 2,
      };
    }

    // Создание данных
    const id = this.app.model.createTransition({
      id: prevId,
      source,
      target,
      color,
      label,
    });
    // Создание модельки
    const transition = new Transition(this.app, id);

    this.items.set(id, transition);
    this.linkTransition(id);

    this.watchTransition(transition);

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'createTransition',
        args: { id, params },
      });
    }
  }

  linkTransition(id: string) {
    const transition = this.items.get(id);
    if (!transition) return;

    // Убираем из предыдущего родителя
    transition.source.parent?.children.remove(transition, Layer.Transitions);
    transition.target.parent?.children.remove(transition, Layer.Transitions);
    this.view.children.remove(transition, Layer.Transitions);

    if (!transition.source.parent || !transition.target.parent) {
      this.view.children.add(transition, Layer.Transitions);
      transition.parent = undefined;
    } else {
      this.view.children.remove(transition, Layer.Transitions);

      const possibleParents = [transition.source.parent, transition.target.parent].filter(Boolean);
      const possibleParentsDepth = possibleParents.map((p) => p?.getDepth() ?? 0);
      const parent = possibleParents[indexOfMin(possibleParentsDepth)] ?? this.view;

      if (parent instanceof State) {
        transition.parent = parent;
      }

      parent.children.add(transition, Layer.Transitions);
    }
  }

  changeTransition(args: ChangeTransitionParams, canUndo = true) {
    const transition = this.items.get(args.id);
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'changeTransition',
        args: { transition, args, prevData: structuredClone(transition.data) },
      });
    }

    this.app.model.changeTransition(args);

    this.view.isDirty = true;
  }

  changeTransitionPosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const transition = this.items.get(id);
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'changeTransitionPosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.app.model.changeTransitionPosition(id, endPosition);

    this.view.isDirty = true;
  }

  deleteTransition(id: string, canUndo = true) {
    const transition = this.items.get(id);
    if (!transition) return;

    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    this.forEachByTargetId(id, (transition) => {
      this.deleteTransition(transition.id, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteTransition',
        args: { transition, prevData: structuredClone(transition.data) },
        numberOfConnectedActions,
      });
    }

    const parent = transition.parent ?? this.view;
    parent.children.remove(transition, Layer.Transitions);
    this.unwatchTransition(transition);
    this.items.delete(id);
    this.app.model.deleteTransition(id);

    this.view.isDirty = true;
  }

  initEvents() {
    this.app.mouse.on('mousemove', this.handleMouseMove);

    this.controller.notes.on('startNewTransitionNote', this.handleStartNewTransition);
    this.controller.notes.on('mouseUpOnNote', this.handleMouseUpOnNote);

    this.controller.states.on('startNewTransitionState', this.handleStartNewTransition);
    this.controller.states.on('mouseUpOnState', this.handleMouseUpOnState);
    this.controller.states.on('mouseUpOnInitialState', this.handleMouseUpOnInitialState);
    this.controller.states.on('mouseUpOnFinalState', this.handleMouseUpOnFinalState);
  }

  handleStartNewTransition = (node: State | ChoiceState | Note) => {
    this.ghost?.setSource(node);
  };

  handleConditionClick = (transition: Transition) => {
    this.controller.selectTransition(transition.id);
  };

  handleConditionDoubleClick = (transition: Transition) => {
    if (!transition.data.label) return;
    this.emit('changeTransition', transition);
  };

  handleContextMenu = (transition: Transition, e: { event: MyMouseEvent }) => {
    this.controller.removeSelection();
    transition.setIsSelected(true);

    this.emit('transitionContextMenu', {
      transition,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost?.source) return;

    this.ghost?.setTarget({ x: e.x, y: e.y });

    this.view.isDirty = true;
  };

  handleMouseUpOnState = (state: State | ChoiceState) => {
    if (!this.ghost?.source) return;
    if (this.ghost.source instanceof Note) {
      this.createTransition({
        color: DEFAULT_TRANSITION_COLOR,
        source: this.ghost?.source.id,
        target: state.id,
      });
    }
    // Переход создаётся только на другое состояние
    // FIXME: вызывать создание внутреннего события при перетаскивании на себя?
    else if (state !== this.ghost?.source) {
      this.emit('createTransition', { source: this.ghost?.source, target: state });
    }
    this.ghost?.clear();

    this.view.isDirty = true;
  };

  handleMouseUpOnTransition = (transition: Transition) => {
    if (!this.ghost?.source) return;

    if (this.ghost.source instanceof Note && transition.data.label) {
      this.createTransition({
        color: DEFAULT_TRANSITION_COLOR,
        source: this.ghost?.source.id,
        target: transition.id,
      });
    }

    this.ghost.clear();
    this.view.isDirty = true;
  };

  handleMouseUpOnNote = (note: Note) => {
    if (!this.ghost?.source) return;

    if (
      this.ghost.source instanceof Note &&
      //Запрещаем создавать связь комментарию для самого себя
      this.ghost.source !== note
    ) {
      this.createTransition({
        color: DEFAULT_TRANSITION_COLOR,
        source: this.ghost?.source.id,
        target: note.id,
      });
    }

    this.ghost.clear();
    this.view.isDirty = true;
  };

  handleMouseUpOnInitialState = (state: InitialState) => {
    if (!this.ghost?.source) return;

    if (this.ghost.source instanceof Note) {
      this.createTransition({
        color: DEFAULT_TRANSITION_COLOR,
        source: this.ghost?.source.id,
        target: state.id,
      });
    }

    this.ghost?.clear();
    this.view.isDirty = true;
  };

  handleMouseUpOnFinalState = (state: FinalState) => {
    if (!this.ghost?.source) return;

    if (this.ghost.source instanceof Note) {
      this.createTransition({
        color: DEFAULT_TRANSITION_COLOR,
        source: this.ghost?.source.id,
        target: state.id,
      });
    } else {
      this.emit('createTransition', { source: this.ghost.source, target: state });
    }

    this.ghost?.clear();
    this.view.isDirty = true;
  };

  handleMouseUp = () => {
    if (!this.ghost?.source) return;

    this.ghost?.clear();
    this.view.isDirty = true;
  };

  handleDragEnd = (
    transition: Transition,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeTransitionPosition(transition.id, e.dragStartPosition, e.dragEndPosition);
  };

  watchTransition(transition: Transition) {
    transition.on('click', this.handleConditionClick.bind(this, transition));
    transition.on('dblclick', this.handleConditionDoubleClick.bind(this, transition));
    transition.on('mouseup', this.handleMouseUpOnTransition.bind(this, transition));
    transition.on('contextmenu', this.handleContextMenu.bind(this, transition));
    transition.on('dragend', this.handleDragEnd.bind(this, transition));
  }

  unwatchTransition(transition: Transition) {
    transition.off('click', this.handleConditionClick.bind(this, transition));
    transition.off('dblclick', this.handleConditionDoubleClick.bind(this, transition));
    transition.off('mouseup', this.handleMouseUpOnTransition.bind(this, transition));
    transition.off('contextmenu', this.handleContextMenu.bind(this, transition));
    transition.off('dragend', this.handleDragEnd.bind(this, transition));
  }
}
