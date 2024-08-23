import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { ChoiceState, Note, Transition } from '@renderer/lib/drawable';
import {
  ChangeComponentPosition,
  ChangeSelectionParams,
  CopyData,
  CopyType,
  CreateChoiceStateParams,
  CreateComponentParams,
  CreateFinalStateParams,
  CreateNoteParams,
  CreateStateParams,
  DeleteDrawableParams,
  EditComponentParams,
  RenameComponentParams,
  SetMountedStatusParams,
} from '@renderer/lib/types';
import { Condition, Variable } from '@renderer/types/diagram';

import { ComponentsController } from './ComponentsController';
import { NotesController } from './NotesController';
import { StateMachineController } from './StateMachineController';
import { StatesController } from './StatesController';
import { TransitionsController } from './TransitionsController';

import { Initializer } from '../Initializer';
import { loadPlatform } from '../PlatformLoader';
import { operatorSet, PlatformManager } from '../PlatformManager';

export type CanvasSubscribeAttribute =
  | 'state'
  | 'component'
  | 'transition'
  | 'note'
  | 'final'
  | 'choice';

export function getSignalName(smId: string, attribute: CanvasSubscribeAttribute): string {
  return `${smId}/${attribute}`;
}

export type CanvasControllerEvents = {
  loadData: null;
  initPlatform: null;
  initEvents: null;

  createChoice: CreateChoiceStateParams;
  createState: CreateStateParams;
  createFinal: CreateFinalStateParams;
  createNote: CreateNoteParams;
  createComponent: CreateComponentParams;
  deleteChoice: DeleteDrawableParams;
  deleteState: DeleteDrawableParams;
  deleteFinal: DeleteDrawableParams;
  deleteNote: DeleteDrawableParams;
  deleteComponent: DeleteDrawableParams;
  editComponent: EditComponentParams;
  renameComponent: RenameComponentParams;
  changeComponentPosition: ChangeComponentPosition;

  selectComponent: { id: string };
  deleteSelected: string;
  copySelected: null;

  isMounted: SetMountedStatusParams;
  changeStateSelection: ChangeSelectionParams;
  changeChoiceSelection: ChangeSelectionParams;
  changeComponentSelection: ChangeSelectionParams;
  changeNoteSelection: ChangeSelectionParams;
  changeTransitionSelection: ChangeSelectionParams;
};

export type CanvasData = {
  platformName: string;
};

export class CanvasController extends EventEmitter<CanvasControllerEvents> {
  app: CanvasEditor;
  platform: PlatformManager | null = null;
  initializer: Initializer;
  states: StatesController;
  transitions: TransitionsController;
  notes: NotesController;
  components: ComponentsController;
  stateMachines: StateMachineController;
  canvasData: CanvasData;
  stateMachinesSub: { [id: string]: CanvasSubscribeAttribute[] } = {};
  id: string;

  private copyData: CopyData | null = null; // То что сейчас скопировано
  private pastePositionOffset = 0; // Для того чтобы при вставке скопированной сущности она не перекрывала предыдущую

  constructor(id: string, app: CanvasEditor, canvasData: CanvasData) {
    super();
    this.id = id;
    this.app = app;
    this.initializer = new Initializer(app, this);

    this.states = new StatesController(app);
    this.transitions = new TransitionsController(app);
    this.notes = new NotesController(app);

    this.components = new ComponentsController(app);
    this.stateMachines = new StateMachineController(app);
    this.canvasData = canvasData;
    this.watch();
  }

  get view() {
    return this.app.view;
  }

  addStateMachineId(smId: string) {
    if (this.stateMachinesSub[smId]) {
      return;
    }
    this.stateMachinesSub[smId] = [];
  }

  // Функция для любой обработки Drawable
  // Используется для обработки сигналов
  private processDrawable<T>(
    attribute: CanvasSubscribeAttribute,
    callback: (args: T, canUndo: boolean) => any,
    parameters: T,
    canUndo: boolean = false
  ) {
    const smId = parameters['smId'];
    if (smId) {
      if (!this.stateMachinesSub[smId]) {
        return;
      }
      if (!this.stateMachinesSub[smId].includes(attribute)) {
        return;
      }
    }
    return callback(parameters, canUndo);
  }

  private bindHelper<T extends (args: any) => any>(
    attribute: CanvasSubscribeAttribute,
    callback: T
  ) {
    return this.processDrawable.bind<
      this,
      [attribute: CanvasSubscribeAttribute, callback: T],
      Parameters<T>,
      ReturnType<T>
    >(this, attribute, callback);
  }

  subscribe(smId: string, attribute: CanvasSubscribeAttribute) {
    if (!this.stateMachinesSub[smId]) {
      return;
    }
    switch (attribute) {
      case 'state':
        this.on('createState', this.bindHelper('state', this.states.createState));
        this.on('deleteState', this.bindHelper('state', this.states.deleteState));
        break;
      case 'final':
        this.on('createFinal', this.bindHelper('final', this.states.createFinalState));
        this.on('deleteFinal', this.bindHelper('final', this.states.deleteFinalState));
        break;
      case 'choice':
        this.on('createChoice', this.bindHelper('choice', this.states.createChoiceState));
        this.on('deleteChoice', this.bindHelper('choice', this.states.deleteChoiceState));
        break;
      case 'note':
        this.on('createNote', this.bindHelper('note', this.notes.createNote));
        this.on('deleteNote', this.bindHelper('note', this.notes.deleteNote));
        break;
      case 'component':
        this.on('createComponent', this.bindHelper('component', this.createComponent));
        this.on('deleteComponent', this.bindHelper('component', this.deleteComponent));
        this.on('editComponent', this.bindHelper('component', this.editComponent));
        this.on('renameComponent', this.bindHelper('component', this.renameComponent));
        this.on('selectComponent', this.bindHelper('component', this.selectComponent));
        break;
      default:
        throw new Error('Unknown attribute');
    }

    if (this.stateMachines[smId].includes(attribute)) {
      return;
    }
    this.stateMachinesSub[smId].push(attribute);
  }

  private renameComponent(args: RenameComponentParams) {
    if (!this.platform) {
      return;
    }
    const { id, newName } = args;
    const visualCompo = this.platform.nameToVisual.get(id);

    if (!visualCompo) return;

    this.platform.nameToVisual.set(newName, visualCompo);
    this.platform.nameToVisual.delete(id);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.states.forEachState((state) => {
      for (const ev of state.eventBox.data) {
        // заменяем в триггере
        if (ev.trigger.component == id) {
          ev.trigger.component = newName;
        }
        for (const act of ev.do) {
          // заменяем в действии
          if (act.component == id) {
            act.component = newName;
          }
        }
      }
    });

    this.transitions.forEach((transition) => {
      if (!transition.data.label) return;

      if (transition.data.label.trigger?.component === id) {
        transition.data.label.trigger.component = newName;
      }

      if (transition.data.label.do) {
        for (const act of transition.data.label.do) {
          if (act.component === id) {
            act.component = newName;
          }
        }
      }

      if (transition.data.label.condition) {
        this.renameCondition(transition.data.label.condition, id, newName);
      }
    });

    this.app.view.isDirty = true;
  }

  private deleteSelected(smId: string) {
    this.states.forEachState((state) => {
      if (!state.isSelected) return;

      if (state.eventBox.selection) {
        this.states.deleteEvent(state.id, state.eventBox.selection);
        state.eventBox.selection = undefined;
        return;
      }

      this.states.deleteState({ smId: smId, id: state.id });
    });

    this.states.data.choiceStates.forEach((state) => {
      if (!state.isSelected) return;

      this.states.deleteChoiceState({ smId: smId, id: state.id });
    });

    this.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      this.transitions.deleteTransition({ smId: smId, id: transition.id });
    });

    this.notes.forEach((note) => {
      if (!note.isSelected) return;

      this.notes.deleteNote({ smId: smId, id: note.id });
    });

    this.components.forEach((component) => {
      if (!component.isSelected) return;

      this.components.deleteComponent({ smId: smId, id: component.id });
    });
  }

  selectComponent(args: { id: string }) {
    const component = this.components.items.get(args.id);
    if (!component) {
      return;
    }
    this.removeSelection();
    component.setIsSelected(true);
  }

  private renameCondition(ac: Condition, oldName: string, newName: string) {
    if (ac.type == 'value') {
      return;
    }
    if (ac.type == 'component') {
      if ((ac.value as Variable).component === oldName) {
        (ac.value as Variable).component = newName;
      }
      return;
    }
    if (operatorSet.has(ac.type)) {
      if (Array.isArray(ac.value)) {
        for (const x of ac.value) {
          this.renameCondition(x, oldName, newName);
        }
        return;
      }
      return;
    }
  }

  private editComponent(args: EditComponentParams) {
    if (!this.platform) {
      return;
    }

    this.components.editComponent(args);
    this.platform.nameToVisual.set(args.id, {
      component: args.type,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    });
  }

  private deleteComponent(args: DeleteDrawableParams) {
    if (!this.platform) {
      return;
    }

    this.components.deleteComponent(args);
    this.stateMachines.deleteComponent(args.smId, args.id);
    this.platform.nameToVisual.delete(args.id);
  }

  private createComponent(args: CreateComponentParams) {
    if (!this.platform) {
      return;
    }
    const component = this.components.createComponent(args);
    if (!component) {
      return;
    }
    // TODO: Добавление компонентов в StateMachine
  }

  private initPlatform() {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platformName = this.canvasData.platformName;
    const platform = loadPlatform(platformName);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformName);
    }

    this.platform = platform;
    //! Инициализировать компоненты нужно сразу после загрузки платформы
    // Их инициализация не создает отдельными сущности на холсте а перерабатывает данные в удобные структуры
    this.initializer.initComponents('', true);
  }

  loadData() {
    this.initializer.init();
    this.app.view.isDirty = true;
  }

  // Отлавливание дефолтных событий для контроллера
  private watch() {
    this.on('loadData', this.loadData);
    this.on('initPlatform', this.initPlatform);
    this.on('initEvents', this.transitions.initEvents);
    this.on('deleteSelected', this.deleteSelected);
  }

  copySelected = () => {
    const nodeToCopy =
      [...this.states.data.states.values()].find((state) => state.isSelected) ||
      [...this.states.data.choiceStates.values()].find((state) => state.isSelected) ||
      [...this.transitions.items.values()].find((transition) => transition.isSelected) ||
      [...this.notes.items.values()].find((note) => note.isSelected);

    if (!nodeToCopy) return;

    // Тип нужен чтобы отделить ноды при вставке
    let copyType: CopyType = 'state';
    if (nodeToCopy instanceof ChoiceState) copyType = 'choiceState';
    if (nodeToCopy instanceof Transition) copyType = 'transition';
    if (nodeToCopy instanceof Note) copyType = 'note';

    // Если скопировалась новая нода, то нужно сбросить смещение позиции вставки
    if (nodeToCopy.id !== this.copyData?.data.id) {
      this.pastePositionOffset = 0;
    }

    this.copyData = {
      type: copyType,
      data: { ...(structuredClone(nodeToCopy.data) as any), id: nodeToCopy.id },
    };
  };

  /**
   * Снимает выделение со всех нод и переходов.
   *
   * @remarks
   * Выполняется при изменении выделения.
   *
   * @privateRemarks
   * Возможно, надо переделать структуру, чтобы не пробегаться по списку каждый раз.
   */
  removeSelection() {
    this.app.controller.states.data.choiceStates.forEach((state) => {
      state.setIsSelected(false);
    });

    this.app.controller.states.forEachState((state) => {
      state.setIsSelected(false);
      state.eventBox.selection = undefined;
    });

    this.app.controller.transitions.forEach((transition) => {
      transition.setIsSelected(false);
    });

    this.app.controller.notes.forEach((note) => {
      note.setIsSelected(false);
    });

    this.app.controller.components.forEach((component) => {
      component.setIsSelected(false);
    });

    this.view.isDirty = true;
  }
}
