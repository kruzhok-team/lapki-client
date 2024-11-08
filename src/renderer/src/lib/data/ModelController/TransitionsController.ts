import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
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
import { Point } from '@renderer/lib/types/graphics';
import {
  ChangePosition,
  ChangeTransitionParams,
  CreateTransitionParams,
  DeleteDrawableParams,
} from '@renderer/lib/types/ModelTypes';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { indexOfMin } from '@renderer/lib/utils';

interface TransitionsControllerEvents {
  changeTransition: string;
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

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  forEachByStateId(stateId: string, callback: (transition: Transition) => void) {
    return this.items.forEach((transition) => {
      if (transition.data.sourceId === stateId || transition.data.targetId === stateId) {
        callback(transition);
      }
    });
  }

  forEachByTargetId(targetId: string, callback: (transition: Transition) => void) {
    return this.items.forEach((transition) => {
      if (transition.data.targetId === targetId) {
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

  updateAll() {
    this.forEach((transition) => {
      transition.label.update();
    });
    this.view.isDirty = true;
  }

  createTransition = (params: CreateTransitionParams) => {
    const { smId, sourceId, targetId, label } = params;
    //TODO: (XidFanSan) где-то должна быть проверка, что цель может быть не-состоянием, только если источник – заметка.
    const source = this.controller.states.get(sourceId) || this.controller.notes.get(sourceId);
    const target =
      this.controller.states.get(targetId) ||
      this.controller.notes.get(targetId) ||
      this.controller.transitions.get(targetId);

    if (!source || !target || !params.id) return;

    if (label && !label.position) {
      label.position = {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      };
    }

    // Создание модельки
    const transition = new Transition(this.app, params.id, smId, { ...params });

    this.items.set(params.id, transition);
    this.view.children.add(transition, Layer.Transitions);

    this.watchTransition(transition);

    this.view.isDirty = true;
  };

  linkTransition = (id: string) => {
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
  };

  changeTransition = (args: ChangeTransitionParams) => {
    const transition = this.items.get(args.id);
    if (!transition) return;
    transition.data = { ...args };
    transition.label.update();
    this.view.isDirty = true;
  };

  changeTransitionPosition = (args: ChangePosition) => {
    const transition = this.items.get(args.id);
    if (!transition) return;
    transition.position = args.endPosition;

    transition.label.update();

    this.view.isDirty = true;
  };

  deleteTransition = (args: DeleteDrawableParams) => {
    const transition = this.items.get(args.id);
    if (!transition) return;
    const parent = transition.parent ?? this.view;
    parent.children.remove(transition, Layer.Transitions);
    this.unwatchTransition(transition);
    this.items.delete(args.id);

    this.view.isDirty = true;
  };

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
    this.controller.selectTransition({ smId: '', id: transition.id });
    this.controller.emit('selectTransition', { smId: transition.smId, id: transition.id });
  };

  handleConditionDoubleClick = (transition: Transition) => {
    this.controller.emit('openChangeTransitionModalFromController', {
      smId: transition.smId,
      id: transition.id,
    });
  };

  handleContextMenu = (transitionId: string, e: { event: MyMouseEvent }) => {
    const item = this.items.get(transitionId);
    if (!item) return;
    this.controller.removeSelection();
    item.setIsSelected(true);

    if (item.source instanceof InitialState) return;

    this.emit('transitionContextMenu', {
      transition: item,
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
    // TODO (L140-beep): И что с этим делать?
    if (this.ghost.source instanceof Note) {
      this.createTransition({
        smId: '',
        sourceId: this.ghost?.source.id,
        targetId: state.id,
      });
    }
    // Переход создаётся только на другое состояние
    // FIXME: вызывать создание внутреннего события при перетаскивании на себя?
    else if (state !== this.ghost?.source) {
      this.controller.emit('createTransitionFromController', {
        smId: state.smId,
        sourceId: this.ghost?.source.id,
        targetId: state.id,
      });
    }
    this.ghost?.clear();

    this.view.isDirty = true;
  };

  handleMouseUpOnTransition = (transition: Transition) => {
    if (!this.ghost?.source) return;

    if (this.ghost.source instanceof Note && transition.data.label) {
      this.createTransition({
        smId: '',
        sourceId: this.ghost?.source.id,
        targetId: transition.id,
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
        smId: '',
        sourceId: this.ghost?.source.id,
        targetId: note.id,
      });
    }

    this.ghost.clear();
    this.view.isDirty = true;
  };

  handleMouseUpOnInitialState = (state: InitialState) => {
    if (!this.ghost?.source) return;

    if (this.ghost.source instanceof Note) {
      this.createTransition({
        smId: '',
        sourceId: this.ghost?.source.id,
        targetId: state.id,
      });
    }

    this.ghost?.clear();
    this.view.isDirty = true;
  };

  handleMouseUpOnFinalState = (state: FinalState) => {
    if (!this.ghost?.source) return;

    if (this.ghost.source instanceof Note) {
      this.createTransition({
        smId: '',
        sourceId: this.ghost?.source.id,
        targetId: state.id,
      });
    } else {
      this.controller.emit('createTransitionFromController', {
        sourceId: this.ghost.source.id,
        smId: state.smId,
        targetId: state.id,
      });
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
    this.changeTransitionPosition({ smId: '', id: transition.id, endPosition: e.dragEndPosition });
  };

  watchTransition(transition: Transition) {
    transition.on('click', this.handleConditionClick.bind(this, transition));
    transition.on('dblclick', this.handleConditionDoubleClick.bind(this, transition));
    transition.on('mouseup', this.handleMouseUpOnTransition.bind(this, transition));
    transition.on('contextmenu', this.handleContextMenu.bind(this, transition.id));
    transition.on('dragend', this.handleDragEnd.bind(this, transition));
  }

  unwatchTransition(transition: Transition) {
    transition.off('click', this.handleConditionClick.bind(this, transition));
    transition.off('dblclick', this.handleConditionDoubleClick.bind(this, transition));
    transition.off('mouseup', this.handleMouseUpOnTransition.bind(this, transition));
    transition.off('contextmenu', this.handleContextMenu.bind(this, transition.id));
    transition.off('dragend', this.handleDragEnd.bind(this, transition));
  }
}
