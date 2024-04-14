import { EditorView } from '@renderer/lib/basic';
import { EventEmitter } from '@renderer/lib/common';
import { History } from '@renderer/lib/data/History';
import { GhostTransition, State, Transition } from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';
import { ChangeTransitionParams, CreateTransitionParams } from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { indexOfMin } from '@renderer/lib/utils';

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

  items: Map<string, Transition> = new Map();

  constructor(private editorView: EditorView, private history: History) {
    super();

    this.ghost = new GhostTransition(editorView);
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

  getIdsByStateId(stateId: string) {
    return [...this.items.entries()]
      .filter(([_, { source, target }]) => source.id === stateId || target.id === stateId)
      .map(([id]) => id);
  }

  createTransition(params: CreateTransitionParams, canUndo = true) {
    const { source, target, color, id: prevId, label } = params;

    const sourceState = this.editorView.editorController.states.get(source);
    const targetState = this.editorView.editorController.states.get(target);

    if (!sourceState || !targetState) return;

    if (label && !label.position) {
      label.position = {
        x: (sourceState.position.x + targetState.position.x) / 2,
        y: (sourceState.position.y + targetState.position.y) / 2,
      };
    }

    // Создание данных
    const id = this.editorView.app.model.createTransition({
      id: prevId,
      source,
      target,
      color,
      label,
    });
    // Создание модельки
    const transition = new Transition(this.editorView, id);

    this.items.set(id, transition);
    this.linkTransition(id);

    this.watchTransition(transition);

    this.editorView.isDirty = true;

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

    if (!transition.source.parent || !transition.target.parent) {
      this.editorView.children.add(transition, Layer.Transitions);
      transition.parent = undefined;
    } else {
      this.editorView.children.remove(transition, Layer.Transitions);

      const possibleParents = [transition.source.parent, transition.target.parent].filter(Boolean);
      const possibleParentsDepth = possibleParents.map((p) => p?.getDepth() ?? 0);
      const parent = possibleParents[indexOfMin(possibleParentsDepth)] ?? this.editorView;

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

    this.editorView.app.model.changeTransition(args);

    this.editorView.isDirty = true;
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

    this.editorView.app.model.changeTransitionPosition(id, endPosition);

    this.editorView.isDirty = true;
  }

  deleteTransition(id: string, canUndo = true) {
    const transition = this.items.get(id);
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'deleteTransition',
        args: { transition, prevData: structuredClone(transition.data) },
      });
    }

    this.editorView.app.model.deleteTransition(id);

    const parent = transition.parent ?? this.editorView;
    parent.children.remove(transition, Layer.Transitions);
    this.unwatchTransition(transition);
    this.items.delete(id);

    this.editorView.isDirty = true;
  }

  initEvents() {
    this.editorView.app.mouse.on('mousemove', this.handleMouseMove);

    this.editorView.editorController.states.on('startNewTransition', this.handleStartNewTransition);
    this.editorView.editorController.states.on('mouseUpOnState', this.handleMouseUpOnState);
  }

  handleStartNewTransition = (state: State) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (transition: Transition) => {
    this.editorView.editorController.selectTransition(transition.id);
  };

  handleConditionDoubleClick = (transition: Transition) => {
    this.emit('changeTransition', transition);
  };

  handleContextMenu = (transition: Transition, e: { event: MyMouseEvent }) => {
    this.editorView.editorController.removeSelection();
    transition.setIsSelected(true);

    this.emit('transitionContextMenu', {
      transition,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.editorView.isDirty = true;
  };

  handleMouseUpOnState = (state: State) => {
    if (!this.ghost.source) return;
    // Переход создаётся только на другое состояние
    // FIXME: вызывать создание внутреннего события при перетаскивании на себя?
    if (state !== this.ghost.source) {
      this.emit('createTransition', { source: this.ghost.source, target: state });
    }
    this.ghost.clear();
    this.editorView.isDirty = true;
  };

  handleMouseUp = () => {
    if (!this.ghost.source) return;
    this.ghost.clear();
    this.editorView.isDirty = true;
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
