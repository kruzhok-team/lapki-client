import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import {
  AddDragendStateSig,
  ChangeComponentPosition,
  ChangeEventParams,
  ChangeNoteText,
  ChangePosition,
  ChangeSelectionParams,
  ChangeStateEventsParams,
  ChangeStateNameParams,
  ChangeTransitionParams,
  CreateChoiceStateParams,
  CreateComponentParams,
  CreateEventActionParams,
  CreateEventParams,
  CreateFinalStateParams,
  CreateInitialStateControllerParams,
  CreateInitialStateParams,
  CreateNoteParams,
  CreateStateParams,
  CreateTransitionParams,
  DeleteDrawableParams,
  DeleteEventParams,
  EditComponentParams,
  Layer,
  LinkStateParams,
  LinkTransitionParams,
  RenameComponentParams,
  SelectDrawable,
  SetMountedStatusParams,
  UnlinkStateParams,
} from '@renderer/lib/types';
import {
  ChoiceState,
  Component,
  Condition,
  FinalState,
  InitialState,
  Note,
  State,
  Transition,
  Variable,
} from '@renderer/types/diagram';

import { ComponentsController } from './ComponentsController';
import { ModelController } from './ModelController';
import { NotesController } from './NotesController';
import { StateMachineController } from './StateMachineController';
import { StatesController } from './StatesController';
import { TransitionsController } from './TransitionsController';

import { Initializer } from '../Initializer';
import { isPlatformAvailable, loadPlatform } from '../PlatformLoader';
import { operatorSet, PlatformManager } from '../PlatformManager';

export type CanvasSubscribeAttribute =
  | 'state'
  | 'component'
  | 'transition'
  | 'note'
  | 'final'
  | 'choice'
  | 'initialState';

type DiagramData =
  | { [id: string]: State }
  | { [id: string]: InitialState }
  | { [id: string]: FinalState }
  | { [id: string]: ChoiceState }
  | { [id: string]: Transition }
  | { [name: string]: Component }
  | { [id: string]: Note };

export function getSignalName(smId: string, attribute: CanvasSubscribeAttribute): string {
  return `${smId}/${attribute}`;
}

export type CanvasControllerEvents = {
  loadData: null;
  initPlatform: null;
  initEvents: null;

  createTransition: CreateTransitionParams;
  changeTransition: ChangeTransitionParams;
  createChoice: CreateChoiceStateParams;
  createState: CreateStateParams;
  changeStatePosition: ChangePosition;
  createFinal: CreateFinalStateParams;
  createNote: CreateNoteParams;
  createInitial: CreateInitialStateControllerParams;
  changeInitialPosition: ChangePosition;
  createComponent: CreateComponentParams;
  deleteChoice: DeleteDrawableParams;
  deleteState: DeleteDrawableParams;
  deleteFinal: DeleteDrawableParams;
  deleteNote: DeleteDrawableParams;
  deleteComponent: DeleteDrawableParams;
  deleteTransition: DeleteDrawableParams;
  editComponent: EditComponentParams;
  renameComponent: RenameComponentParams;
  changeComponentPosition: ChangeComponentPosition;
  changeChoicePosition: ChangePosition;

  createEvent: CreateEventParams;
  createEventAction: CreateEventActionParams;
  changeEvent: ChangeEventParams;
  changeEventAction: ChangeEventParams;
  deleteEvent: DeleteEventParams;

  changeNoteText: ChangeNoteText;
  changeNotePosition: ChangePosition;
  selectNote: SelectDrawable;
  selectState: SelectDrawable;
  selectComponent: SelectDrawable;
  selectChoice: SelectDrawable;
  selectTransition: SelectDrawable;
  deleteSelected: string;

  isMounted: SetMountedStatusParams;
  changeScale: number;
  changeStateSelection: ChangeSelectionParams;

  changeChoiceSelection: ChangeSelectionParams;
  changeComponentSelection: ChangeSelectionParams;
  changeNoteSelection: ChangeSelectionParams;
  changeTransitionSelection: ChangeSelectionParams;
  changeTransitionPosition: ChangePosition;

  linkTransitions: LinkTransitionParams;
  addDragendStateSig: AddDragendStateSig;
  linkState: LinkStateParams;
  linkFinalState: LinkStateParams;
  linkChoiceState: LinkStateParams;
  unlinkState: UnlinkStateParams;
  changeStateEvents: ChangeStateEventsParams;
  changeStateName: ChangeStateNameParams;
  changeFinalStatePosition: ChangePosition;
  deleteEventAction: DeleteEventParams;
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
  scale = 1;
  offset = { x: 0, y: 0 }; // Нигде не меняется?
  isMounted = false;
  canvasId: string | null = null;
  model: ModelController;
  constructor(id: string, app: CanvasEditor, canvasData: CanvasData, model: ModelController) {
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
    this.model = model;
    this.initPlatform();
    // this.watch();
  }

  get view() {
    return this.app.view;
  }

  setOffset(value: { x: number; y: number }) {
    this.offset = value;
  }

  addStateMachineId(smId: string) {
    if (this.stateMachinesSub[smId]) {
      return;
    }
    this.stateMachinesSub[smId] = [];
  }

  // Функция для любой обработки Drawable
  // Используется для обработки сигналов
  processDrawable<T>(
    attribute: CanvasSubscribeAttribute,
    callback: (args: T) => any,
    parameters: T
  ) {
    const smId = parameters['smId'];
    if (smId) {
      // сюда не попадаем
      if (!this.stateMachinesSub[smId]) {
        return () => null;
      }
      // сюда тоже
      if (!this.stateMachinesSub[smId].includes(attribute)) {
        return () => null;
      }
    }
    console.log('return callback');
    return callback(parameters);
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

  // TODO(L140-beep): ПОФИКСИТЬ СОБЫТИЯ ТАК, ЧТОБЫ БЫЛО КАК В SUBSCRIBE
  unwatch() {
    const attributes = Object.values(this.stateMachinesSub);
    for (const attributeSet of attributes) {
      for (const attribute of attributeSet) {
        switch (attribute) {
          case 'state':
            this.off('createState', this.bindHelper('state', this.states.createState));
            this.off('deleteState', this.bindHelper('state', this.states.deleteState));
            this.off('selectState', this.bindHelper('state', this.selectComponent));
            this.off('addDragendStateSig', this.bindHelper('state', this.addDragendState));
            this.off('linkState', this.bindHelper('state', this.linkState));
            this.off('unlinkState', this.bindHelper('state', this.states.unlinkState));
            this.off('changeStateEvents', this.bindHelper('state', this.states.changeStateEvents));
            this.off('changeStateName', this.bindHelper('state', this.states.changeStateName));
            this.off(
              'changeStatePosition',
              this.bindHelper('state', this.states.changeStatePosition)
            );
            this.off('createEvent', this.bindHelper('state', this.states.createEvent));
            this.off('createEventAction', this.bindHelper('state', this.states.createEventAction));
            this.off('changeEvent', this.bindHelper('state', this.states.changeEvent));
            this.off('changeEventAction', this.bindHelper('state', this.states.changeEvent));
            this.off('deleteEventAction', this.bindHelper('state', this.states.deleteEvent));
            break;
          case 'initialState':
            this.off(
              'createInitial',
              this.bindHelper('initialState', this.states.createInitialState)
            );
            this.off(
              'changeInitialPosition',
              this.bindHelper('initialState', this.states.changeInitialStatePosition)
            );
            break;
          case 'final':
            this.off('createFinal', this.bindHelper('final', this.states.createFinalState));
            this.off('deleteFinal', this.bindHelper('final', this.states.deleteFinalState));
            this.off(
              'changeFinalStatePosition',
              this.bindHelper('final', this.states.changeFinalStatePosition)
            );
            this.off('linkFinalState', this.states.linkFinalState);
            break;
          case 'choice':
            this.off('createChoice', this.bindHelper('choice', this.states.createChoiceState));
            this.off('deleteChoice', this.bindHelper('choice', this.states.deleteChoiceState));
            this.off('selectState', this.bindHelper('choice', this.selectChoice));
            this.off('linkChoiceState', this.bindHelper('choice', this.states.linkChoiceState));
            this.off(
              'changeChoicePosition',
              this.bindHelper('choice', this.states.changeChoiceStatePosition)
            );
            break;
          case 'note':
            this.off('createNote', this.bindHelper('note', this.notes.createNote));
            this.off('deleteNote', this.bindHelper('note', this.notes.deleteNote));
            this.off('selectNote', this.bindHelper('note', this.selectNote));
            this.off('changeNoteText', this.bindHelper('note', this.notes.changeNoteText));
            this.off('changeNotePosition', this.bindHelper('note', this.notes.changeNotePosition));
            break;
          case 'component':
            this.off('createComponent', this.bindHelper('component', this.createComponent));
            this.off('deleteComponent', this.bindHelper('component', this.deleteComponent));
            this.off('editComponent', this.bindHelper('component', this.editComponent));
            this.off('renameComponent', this.bindHelper('component', this.renameComponent));
            this.off('selectComponent', this.bindHelper('component', this.selectComponent));
            // this.initializer.initNotes(initData as { [id: string]: Note });
            break;
          case 'transition':
            this.off(
              'createTransition',
              this.bindHelper('transition', this.transitions.createTransition)
            );
            this.off(
              'deleteTransition',
              this.bindHelper('transition', this.transitions.deleteTransition)
            );
            this.off(
              'changeTransition',
              this.bindHelper('transition', this.transitions.changeTransition)
            );
            this.off('changeTransitionPosition', this.transitions.changeTransitionPosition);
            this.off('selectTransition', this.bindHelper('transition', this.selectTransition));
            this.off('linkTransitions', this.bindHelper('transition', this.linkTransitions));
            break;
          default:
            throw new Error('Unknown attribute');
        }
      }
    }

    this.off('loadData', this.loadData);
    this.off('initPlatform', this.initPlatform);
    this.off('initEvents', this.transitions.initEvents);
    this.off('deleteSelected', this.deleteSelected);
    this.off('changeScale', (value) => {
      this.scale = value;
    });
    this.off('isMounted', this.setMountStatus);
  }

  initComponents(components: { [id: string]: Component }) {
    if (!this.platform) return;
    for (const [id, componentData] of Object.entries(components)) {
      this.platform.nameToVisual.set(id, {
        component: componentData.type,
        label: componentData.parameters['label'],
        color: componentData.parameters['labelColor'],
      });
    }
  }

  subscribe(smId: string, attribute: CanvasSubscribeAttribute, initData: DiagramData) {
    if (!this.stateMachinesSub[smId] || !this.model) {
      return;
    }
    if (this.stateMachinesSub[smId].includes(attribute)) {
      return;
    }
    this.stateMachinesSub[smId].push(attribute);
    console.log('subscribe: ', smId, attribute);
    switch (attribute) {
      case 'state':
        this.model.on(
          'createState',
          this.bindHelper('state', (args: CreateStateParams) => this.states.createState(args))
        );
        this.model.on(
          'deleteState',
          this.bindHelper('state', (args: DeleteDrawableParams) => this.states.deleteState(args))
        );
        this.model.on(
          'selectState',
          this.bindHelper('state', (args: SelectDrawable) => this.selectComponent(args))
        );
        this.model.on(
          'addDragendStateSig',
          this.bindHelper('state', (args: AddDragendStateSig) => this.addDragendState(args))
        );
        this.model.on(
          'linkState',
          this.bindHelper('state', (args: LinkStateParams) => this.linkState(args))
        );
        this.model.on(
          'unlinkState',
          this.bindHelper('state', (args: UnlinkStateParams) => this.states.unlinkState(args))
        );
        this.model.on(
          'changeStateEvents',
          this.bindHelper('state', (args: ChangeStateEventsParams) =>
            this.states.changeStateEvents(args)
          )
        );
        this.model.on(
          'changeStateName',
          this.bindHelper('state', (args: ChangeStateNameParams) =>
            this.states.changeStateName(args)
          )
        );
        this.model.on(
          'changeStatePosition',
          this.bindHelper('state', (args: ChangePosition) => this.states.changeStatePosition(args))
        );
        this.model.on(
          'createEvent',
          this.bindHelper('state', (args: CreateEventParams) => this.states.createEvent(args))
        );
        this.model.on(
          'createEventAction',
          this.bindHelper('state', (args: CreateEventActionParams) =>
            this.states.createEventAction(args)
          )
        );
        this.model.on(
          'changeEvent',
          this.bindHelper('state', (args: ChangeEventParams) => this.states.changeEvent(args))
        );
        this.model.on(
          'changeEventAction',
          this.bindHelper('state', (args: ChangeEventParams) => this.states.changeEvent(args))
        );
        this.model.on(
          'deleteEventAction',
          this.bindHelper('state', (args: DeleteEventParams) => this.states.deleteEvent(args))
        );
        this.initializer.initStates(initData as { [id: string]: State });
        break;
      case 'initialState':
        this.model.on(
          'createInitial',
          this.bindHelper('initialState', (args: CreateInitialStateControllerParams) =>
            this.states.createInitialState(args)
          )
        );
        this.model.on(
          'changeInitialPosition',
          this.bindHelper('initialState', (args: ChangePosition) =>
            this.states.changeInitialStatePosition(args)
          )
        );
        this.initializer.initInitialStates(initData as { [id: string]: InitialState });
        break;
      case 'final':
        this.model.on(
          'createFinal',
          this.bindHelper('final', (args: CreateFinalStateParams) =>
            this.states.createFinalState(args)
          )
        );
        this.model.on(
          'deleteFinal',
          this.bindHelper('final', (args: DeleteDrawableParams) =>
            this.states.deleteFinalState(args)
          )
        );
        this.model.on(
          'changeFinalStatePosition',
          this.bindHelper('final', (args: ChangePosition) =>
            this.states.changeFinalStatePosition(args)
          )
        );
        this.model.on('linkFinalState', this.states.linkFinalState);
        this.initializer.initFinalStates(initData as { [id: string]: FinalState });
        break;
      case 'choice':
        this.model.on(
          'createChoice',
          this.bindHelper('choice', (args: CreateChoiceStateParams) =>
            this.states.createChoiceState(args)
          )
        );
        this.model.on(
          'deleteChoice',
          this.bindHelper('choice', (args: DeleteDrawableParams) =>
            this.states.deleteChoiceState(args)
          )
        );
        this.model.on(
          'selectState',
          this.bindHelper('choice', (args: SelectDrawable) => this.selectChoice(args))
        );
        this.model.on(
          'linkChoiceState',
          this.bindHelper('choice', (args: LinkStateParams) => this.states.linkChoiceState(args))
        );
        this.model.on(
          'changeChoicePosition',
          this.bindHelper('choice', (args: ChangePosition) =>
            this.states.changeChoiceStatePosition(args)
          )
        );
        this.initializer.initChoiceStates(initData as { [id: string]: ChoiceState });
        break;
      case 'note':
        this.model.on(
          'createNote',
          this.bindHelper('note', (args: CreateNoteParams) => this.notes.createNote(args))
        );
        this.model.on(
          'deleteNote',
          this.bindHelper('note', (args: DeleteDrawableParams) => this.notes.deleteNote(args))
        );
        this.model.on(
          'selectNote',
          this.bindHelper('note', (args: SelectDrawable) => this.selectNote(args))
        );
        this.model.on(
          'changeNoteText',
          this.bindHelper('note', (args: ChangeNoteText) => this.notes.changeNoteText(args))
        );
        this.model.on(
          'changeNotePosition',
          this.bindHelper('note', (args: ChangePosition) => this.notes.changeNotePosition(args))
        );
        this.initializer.initNotes(initData as { [id: string]: Note });
        break;
      case 'component':
        console.log('subscribed', this.id);
        this.model.on(
          'createComponent',
          this.bindHelper('component', (args: CreateComponentParams) => this.createComponent(args))
        );
        this.model.on(
          'deleteComponent',
          this.bindHelper('component', (args: DeleteDrawableParams) => this.deleteComponent(args))
        );
        this.model.on(
          'editComponent',
          this.bindHelper('component', (args: EditComponentParams) => this.editComponent(args))
        );
        this.model.on(
          'renameComponent',
          this.bindHelper('component', (args: RenameComponentParams) => this.renameComponent(args))
        );
        this.model.on(
          'selectComponent',
          this.bindHelper('component', (args: SelectDrawable) => this.selectComponent(args))
        );
        // this.initializer.initNotes(initData as { [id: string]: Note });
        this.initComponents(initData as { [id: string]: Component });
        break;
      case 'transition':
        this.model.on(
          'createTransition',
          this.bindHelper('transition', (args: CreateTransitionParams) =>
            this.transitions.createTransition(args)
          )
        );
        this.model.on(
          'deleteTransition',
          this.bindHelper('transition', (args: DeleteDrawableParams) =>
            this.transitions.deleteTransition(args)
          )
        );
        this.model.on(
          'changeTransition',
          this.bindHelper('transition', (args: ChangeTransitionParams) =>
            this.transitions.changeTransition(args)
          )
        );
        this.model.on('changeTransitionPosition', (args: ChangePosition) =>
          this.transitions.changeTransitionPosition(args)
        );
        this.model.on(
          'selectTransition',
          this.bindHelper('transition', (args: SelectDrawable) => this.selectTransition(args))
        );
        this.model.on(
          'linkTransitions',
          this.bindHelper('transition', (args: LinkTransitionParams) => this.linkTransitions(args))
        );
        this.initializer.initTransitions(initData as { [id: string]: Transition });
        break;
      default:
        throw new Error('Unknown attribute');
    }
  }

  private addDragendState(args: AddDragendStateSig) {
    const { stateId } = args;
    const state = this.states.get(stateId);
    if (!state) {
      return;
    }
    state.addOnceOff('dragend'); // Линковка состояния меняет его позицию и это плохо для undo
    this.view.isDirty = true;
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
        this.states.deleteEvent({ smId, stateId: state.id, event: state.eventBox.selection });
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

  selectNote(args: SelectDrawable) {
    const note = this.notes.items.get(args.id);
    if (!note) {
      return;
    }
    this.removeSelection();
    note.setIsSelected(true);
  }

  selectTransition(args: SelectDrawable) {
    const transition = this.transitions.items.get(args.id);
    if (!transition) {
      return;
    }
    this.removeSelection();
    transition.setIsSelected(true);
  }

  selectChoice(args: SelectDrawable) {
    const state = this.states.data.choiceStates.get(args.id);
    if (!state) {
      return;
    }
    this.removeSelection();
    state.setIsSelected(true);
  }

  selectState(args: SelectDrawable) {
    const state = this.states.data.states.get(args.id);
    if (!state) {
      return;
    }
    this.removeSelection();
    state.setIsSelected(true);
  }

  selectComponent(args: SelectDrawable) {
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

    // this.components.editComponent(args);
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

    // this.components.deleteComponent(args);
    // this.stateMachines.deleteComponent(args.smId, args.id);
    this.platform.nameToVisual.delete(args.id);
  }

  createComponent(args: CreateComponentParams) {
    if (!this.platform) {
      return;
    }
    this.platform.nameToVisual.set(args.name, {
      component: args.type,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    });
    // const component = this.components.createComponent(args);
    // if (!component) {
    // return;
    // }
    // TODO: Добавление компонентов в StateMachine
  }

  initPlatform() {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    console.log('INIT_PLATFORM');
    if (!this.platform && isPlatformAvailable(this.canvasData.platformName)) {
      const platformName = this.canvasData.platformName;
      const platform = loadPlatform(platformName);
      if (typeof platform === 'undefined') {
        throw Error("couldn't init platform " + platformName);
      }
      this.platform = platform;
    }
    //! Инициализировать компоненты нужно сразу после загрузки платформы
    // Их инициализация не создает отдельными сущности на холсте а перерабатывает данные в удобные структуры
    // this.initializer.initComponents('', true);
  }

  loadData() {
    // this.initializer.init();
    if (this.app) {
      this.app.view.isDirty = true;
    }
  }

  // Отлавливание дефолтных событий для контроллера
  watch() {
    this.model.on('loadData', () => this.loadData());
    this.model.on('initEvents', () => this.transitions.initEvents());
    this.model.on('deleteSelected', (smId: string) => this.deleteSelected(smId));
    this.model.on('changeScale', (value) => {
      this.scale = value;
    });
    this.model.on('isMounted', (args: SetMountedStatusParams) => this.setMountStatus(args));
  }

  private setMountStatus(args: SetMountedStatusParams) {
    if (!this || args.canvasId !== this.app.id) return;
    this.isMounted = args.status;
  }

  private linkState(args: LinkStateParams) {
    const { childId, parentId } = args;
    const child = this.states.get(childId);
    const parent = this.states.get(parentId);
    if (!child || !parent) return;
    (child.parent || this.view).children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);
  }

  private linkTransitions(args: LinkTransitionParams) {
    const { stateId } = args;
    this.transitions.forEachByStateId(stateId, (transition) =>
      this.transitions.linkTransition(transition.id)
    );
  }

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
