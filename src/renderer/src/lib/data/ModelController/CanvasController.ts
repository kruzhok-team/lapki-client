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
  CreateNoteParams,
  CreateStateParams,
  CreateTransitionParams,
  DeleteDrawableParams,
  DeleteEventParams,
  DeleteStateMachineParams,
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
  emptyStateMachine,
  FinalState,
  InitialState,
  Note,
  State,
  StateMachine,
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

  createTransitionFromController: {
    source: string;
    target: string;
  };

  deleteInitialState: DeleteDrawableParams;
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
  createTransitionFromInitialState: CreateTransitionParams;
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
  deleteStateMachine: DeleteStateMachineParams;
};

export type CanvasData = {
  platformName: string;
};

// Это разделение нужно при удалении машин состояний.
// scheme и common все равно контроллерам, если связанные с ними машины состояний удалят
// А specific становится не нужным, если его машину состояний удалят
// specific - канвас для работы с определенной машиной состояний
// scheme - схемотехнический экран
// common - для работы сразу со всеми машинами состояний
export type CanvasControllerType = 'specific' | 'scheme' | 'common';

export class CanvasController extends EventEmitter<CanvasControllerEvents> {
  app: CanvasEditor;
  platform: PlatformManager | null = null;
  initializer: Initializer;
  states: StatesController;
  transitions: TransitionsController;
  notes: NotesController;
  components: ComponentsController;
  stateMachines: StateMachineController;
  initData: StateMachine = emptyStateMachine();
  canvasData: CanvasData;
  stateMachinesSub: { [id: string]: CanvasSubscribeAttribute[] } = {};
  id: string;
  scale = 1;
  offset = { x: 0, y: 0 }; // Нигде не меняется?
  isMounted = false;
  binded = {}; // Функции обработчики
  model: ModelController;
  type: CanvasControllerType;
  constructor(
    id: string,
    type: CanvasControllerType,
    app: CanvasEditor,
    canvasData: CanvasData,
    model: ModelController
  ) {
    super();
    this.id = id;
    this.app = app;
    this.initializer = new Initializer(app, this);
    this.type = type;
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

    return callback(parameters);
  }

  init() {
    this.initComponents(this.initData.components);
    this.initializer.initStates(this.initData.states);
    this.initializer.initChoiceStates(this.initData.choiceStates);
    this.initializer.initFinalStates(this.initData.finalStates);
    this.initializer.initNotes(this.initData.notes);
    this.initializer.initInitialStates(this.initData.initialStates);
    this.initializer.initTransitions(this.initData.transitions);
  }

  private bindHelper<T extends (args: any) => any>(
    attribute: CanvasSubscribeAttribute,
    bindName: string,
    callback: T
  ) {
    this.binded[bindName] = this.processDrawable.bind<
      this,
      [attribute: CanvasSubscribeAttribute, callback: T],
      Parameters<T>,
      ReturnType<T>
    >(this, attribute, callback);
    return this.binded[bindName];
  }

  // TODO(L140-beep): ПОФИКСИТЬ СОБЫТИЯ ТАК, ЧТОБЫ БЫЛО КАК В SUBSCRIBE
  unwatch() {
    const attributes = Object.values(this.stateMachinesSub);
    for (const attributeSet of attributes) {
      for (const attribute of attributeSet) {
        switch (attribute) {
          case 'state':
            this.model.off('createState', this.binded['createState']);
            this.model.off('deleteState', this.binded['deleteState']);
            this.model.off('selectState', this.binded['selectState']);
            this.model.off('addDragendStateSig', this.binded['addDragendStateSig']);
            this.model.off('linkState', this.binded['linkState']);
            this.model.off('unlinkState', this.binded['unlinkState']);
            this.model.off('changeStateEvents', this.binded['changeStateEvents']);
            this.model.off('changeStateName', this.binded['changeStateName']);
            this.model.off('changeStatePosition', this.binded['changeStatePosition']);
            this.model.off('createEvent', this.binded['createEvent']);
            this.model.off('createEventAction', this.binded['createEventAction']);
            this.model.off('changeEvent', this.binded['changeEvent']);
            this.model.off('changeEventAction', this.binded['changeEventAction']);
            this.model.off('deleteEventAction', this.binded['deleteEventAction']);
            // this.initializer.initStates(initData as { [id: string]: State });
            break;
          case 'initialState':
            this.model.off('createInitial', this.binded['createInitial']);
            this.model.off('changeInitialPosition', this.binded['changeInitialPosition']);
            this.model.off('deleteInitialState', this.binded['deleteInitialState']);
            // this.initializer.initInitialStates(initData as { [id: string]: InitialState });
            break;
          case 'final':
            this.model.off('createFinal', this.binded['createFinal']);
            this.model.off('deleteFinal', this.binded['deleteFinal']);
            this.model.off('changeFinalStatePosition', this.binded['changeFinalStatePosition']);
            this.model.off('linkFinalState', this.binded['linkFinalState']);
            // this.initializer.initFinalStates(initData as { [id: string]: FinalState });
            break;
          case 'choice':
            this.model.off('createChoice', this.binded['createChoice']);
            this.model.off('deleteChoice', this.binded['deleteChoice']);
            this.model.off('selectState', this.binded['selectState']);
            this.model.off('linkChoiceState', this.binded['linkChoiceState']);
            this.model.off('changeChoicePosition', this.binded['changeChoicePosition']);
            // this.initializer.initChoiceStates(initData as { [id: string]: ChoiceState });
            break;
          case 'note':
            this.model.off('createNote', this.binded['createNote']);
            this.model.off('deleteNote', this.binded['deleteNote']);
            this.model.off('selectNote', this.binded['selectNote']);
            this.model.off('changeNoteText', this.binded['changeNoteText']);
            this.model.off('changeNotePosition', this.binded['changeNotePosition']);
            // this.initializer.initNotes(initData as { [id: string]: Note });
            break;
          case 'component':
            this.model.off('createComponent', this.binded['createComponent']);
            this.model.off('deleteComponent', this.binded['deleteComponent']);
            this.model.off('editComponent', this.binded['editComponent']);
            this.model.off('renameComponent', this.binded['renameComponent']);
            this.model.off('selectComponent', this.binded['selectComponent']);
            // this.initializer.initNotes(initData as { [id: string]: Note });
            // this.initComponents(initData as { [id: string]: Component });
            break;
          case 'transition':
            this.model.off('createTransition', this.binded['createTransition']);
            this.model.off('deleteTransition', this.binded['deleteTransition']);
            this.model.off(
              'createTransitionFromInitialState',
              this.binded['createTransitionFromInitialState']
            );
            this.model.off('changeTransition', this.binded['changeTransition']);
            this.model.off('changeTransitionPosition', this.binded['changeTransitionPosition']);
            this.model.off('selectTransition', this.binded['selectTransition']);
            this.model.off('linkTransitions', this.binded['linkTransitions']);
            // this.initializer.initTransitions(initData as { [id: string]: Transition });
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
    this.off('changeScale', this.changeScale);
    this.off('isMounted', this.setMountStatus);

    this.states.unwatchAll();
  }

  changeScale = (value: number) => {
    this.scale = value;
  };

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
  // TODO (L140-beep): Поменять привязанные функции на стрелочные (сами функции, а не при привязке)
  subscribe(smId: string, attribute: CanvasSubscribeAttribute, initData: DiagramData) {
    if (!this.stateMachinesSub[smId] || !this.model) {
      return;
    }
    if (this.stateMachinesSub[smId].includes(attribute)) {
      return;
    }
    this.stateMachinesSub[smId].push(attribute);
    switch (attribute) {
      case 'state':
        this.model.on(
          'createState',
          this.bindHelper('state', 'createState', this.states.createState)
        );
        this.model.on(
          'deleteState',
          this.bindHelper('state', 'deleteState', this.states.deleteState)
        );
        this.model.on('selectState', this.bindHelper('state', 'selectState', this.selectComponent));
        this.model.on(
          'addDragendStateSig',
          this.bindHelper('state', 'addDragendStateSig', this.addDragendState)
        );
        this.model.on('linkState', this.bindHelper('state', 'linkState', this.linkState));
        this.model.on(
          'unlinkState',
          this.bindHelper('state', 'unlinkState', this.states.unlinkState)
        );
        this.model.on(
          'changeStateEvents',
          this.bindHelper('state', 'changeStateEvents', this.states.changeStateEvents)
        );
        this.model.on(
          'changeStateName',
          this.bindHelper('state', 'changeStateName', this.states.changeStateName)
        );
        this.model.on(
          'changeStatePosition',
          this.bindHelper('state', 'changeStatePosition', this.states.changeStatePosition)
        );
        this.model.on(
          'createEvent',
          this.bindHelper('state', 'createEvent', this.states.createEvent)
        );
        this.model.on(
          'createEventAction',
          this.bindHelper('state', 'createEventAction', this.states.createEventAction)
        );
        this.model.on(
          'changeEvent',
          this.bindHelper('state', 'changeEvent', this.states.changeEvent)
        );
        this.model.on(
          'changeEventAction',
          this.bindHelper('state', 'changeEventAction', this.states.changeEvent)
        );
        this.model.on(
          'deleteEventAction',
          this.bindHelper('state', 'deleteEventAction', this.states.deleteEvent)
        );
        this.initData.states = {
          ...this.initData.states,
          ...(initData as { [id: string]: State }),
        };
        break;
      case 'initialState':
        this.model.on(
          'createInitial',
          this.bindHelper('initialState', 'createInitial', this.states.createInitialState)
        );
        this.model.on(
          'deleteInitialState',
          this.bindHelper('initialState', 'deleteInitialState', this.states.deleteInitialState)
        );
        this.model.on(
          'changeInitialPosition',
          this.bindHelper(
            'initialState',
            'changeInitialPosition',
            this.states.changeInitialStatePosition
          )
        );
        this.initData.initialStates = {
          ...this.initData.initialStates,
          ...(initData as { [id: string]: InitialState }),
        };
        break;
      case 'final':
        this.model.on(
          'createFinal',
          this.bindHelper('final', 'createFinal', this.states.createFinalState)
        );
        this.model.on(
          'deleteFinal',
          this.bindHelper('final', 'deleteFinal', this.states.deleteFinalState)
        );
        this.model.on(
          'changeFinalStatePosition',
          this.bindHelper('final', 'changeFinalStatePosition', this.states.changeFinalStatePosition)
        );
        this.model.on(
          'linkFinalState',
          this.bindHelper('final', 'linkFinalState', this.states.linkFinalState)
        );
        this.initData.finalStates = {
          ...this.initData.finalStates,
          ...(initData as { [id: string]: FinalState }),
        };
        break;
      case 'choice':
        this.model.on(
          'createChoice',
          this.bindHelper('choice', 'createChoice', this.states.createChoiceState)
        );
        this.model.on(
          'deleteChoice',
          this.bindHelper('choice', 'deleteChoice', this.states.deleteChoiceState)
        );
        this.model.on(
          'selectState',
          this.bindHelper('choice', 'linkFinalState', this.selectChoice)
        );
        this.model.on(
          'linkChoiceState',
          this.bindHelper('choice', 'linkChoiceState', this.states.linkChoiceState)
        );
        this.model.on(
          'changeChoicePosition',
          this.bindHelper('choice', 'changeChoicePosition', this.states.changeChoiceStatePosition)
        );
        this.initData.choiceStates = {
          ...this.initData.choiceStates,
          ...(initData as { [id: string]: ChoiceState }),
        };
        break;
      case 'note':
        this.model.on('createNote', this.bindHelper('note', 'createNote', this.notes.createNote));
        this.model.on('deleteNote', this.bindHelper('note', 'deleteNote', this.notes.deleteNote));
        this.model.on('selectNote', this.bindHelper('note', 'selectNote', this.selectNote));
        this.model.on(
          'changeNoteText',
          this.bindHelper('note', 'changeNoteText', this.notes.changeNoteText)
        );
        this.model.on(
          'changeNotePosition',
          this.bindHelper('note', 'changeNotePosition', this.notes.changeNotePosition)
        );
        this.initData.notes = {
          ...this.initData.notes,
          ...(initData as { [id: string]: Note }),
        };
        break;
      case 'component':
        this.model.on(
          'createComponent',
          this.bindHelper('component', 'createComponent', this.createComponent)
        );
        this.model.on(
          'deleteComponent',
          this.bindHelper('component', 'deleteComponent', this.deleteComponent)
        );
        this.model.on(
          'editComponent',
          this.bindHelper('component', 'editComponent', this.editComponent)
        );
        this.model.on(
          'renameComponent',
          this.bindHelper('component', 'renameComponent', this.renameComponent)
        );
        this.model.on(
          'selectComponent',
          this.bindHelper('component', 'selectComponent', this.selectComponent)
        );
        this.initData.components = {
          ...this.initData.components,
          ...(initData as { [id: string]: Component }),
        };
        break;
      case 'transition':
        this.model.on(
          'createTransition',
          this.bindHelper('transition', 'createTransition', this.transitions.createTransition)
        );
        this.model.on(
          'deleteTransition',
          this.bindHelper('transition', 'deleteTransition', this.transitions.deleteTransition)
        );
        this.model.on(
          'createTransitionFromInitialState',
          this.bindHelper(
            'transition',
            'createTransitionFromInitialState',
            this.transitions.createTransition
          )
        );
        this.model.on(
          'changeTransition',
          this.bindHelper('transition', 'changeTransition', this.transitions.changeTransition)
        );
        this.model.on(
          'changeTransitionPosition',
          this.bindHelper(
            'transition',
            'changeTransitionPosition',
            this.transitions.changeTransitionPosition
          )
        );
        this.model.on(
          'selectTransition',
          this.bindHelper('transition', 'selectTransition', this.selectTransition)
        );
        this.model.on(
          'linkTransitions',
          this.bindHelper('transition', 'linkTransitions', this.linkTransitions)
        );
        this.initData.transitions = {
          ...this.initData.transitions,
          ...(initData as { [id: string]: Transition }),
        };
        break;
      default:
        throw new Error('Unknown attribute');
    }
  }

  private addDragendState = (args: AddDragendStateSig) => {
    const { stateId } = args;
    const state = this.states.get(stateId);
    if (!state) {
      return;
    }
    state.addOnceOff('dragend'); // Линковка состояния меняет его позицию и это плохо для undo
    this.view.isDirty = true;
  };

  private renameComponent = (args: RenameComponentParams) => {
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
  };

  private deleteSelected = (smId: string) => {
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
  };

  selectNote = (args: SelectDrawable) => {
    const note = this.notes.items.get(args.id);
    if (!note) {
      return;
    }
    this.removeSelection();
    note.setIsSelected(true);
  };

  selectTransition = (args: SelectDrawable) => {
    const transition = this.transitions.items.get(args.id);
    if (!transition) {
      return;
    }
    this.removeSelection();
    transition.setIsSelected(true);
  };

  selectChoice = (args: SelectDrawable) => {
    const state = this.states.data.choiceStates.get(args.id);
    if (!state) {
      return;
    }
    this.removeSelection();
    state.setIsSelected(true);
  };

  selectState(args: SelectDrawable) {
    const state = this.states.data.states.get(args.id);
    if (!state) {
      return;
    }
    this.removeSelection();
    state.setIsSelected(true);
  }

  selectComponent = (args: SelectDrawable) => {
    const component = this.components.items.get(args.id);
    if (!component) {
      return;
    }
    this.removeSelection();
    component.setIsSelected(true);
  };

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

  private editComponent = (args: EditComponentParams) => {
    if (!this.platform) {
      return;
    }

    // this.components.editComponent(args);
    this.platform.nameToVisual.set(args.id, {
      component: args.type,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    });
  };

  private deleteComponent(args: DeleteDrawableParams) {
    if (!this.platform) {
      return;
    }

    // this.components.deleteComponent(args);
    // this.stateMachines.deleteComponent(args.smId, args.id);
    this.platform.nameToVisual.delete(args.id);
  }

  createComponent = (args: CreateComponentParams) => {
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
  };

  initPlatform = () => {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
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
  };

  loadData = () => {
    // this.initializer.init();
    if (this.app) {
      this.app.view.isDirty = true;
    }
  };

  deleteStateMAchine(args: DeleteStateMachineParams) {
    const { id } = args;
    if (!this.stateMachinesSub[id]) return;

    delete this.stateMachinesSub[id];
  }

  // Отлавливание дефолтных событий для контроллера
  watch() {
    this.model.on('deleteStateMachine', this.deleteStateMAchine);
    this.model.on('loadData', () => this.loadData());
    this.model.on('initEvents', () => this.transitions.initEvents());
    this.model.on('deleteSelected', (smId: string) => this.deleteSelected(smId));
    this.model.on('changeScale', (value) => {
      this.scale = value;
      this.app.view.isDirty = true;
    });
    this.model.on('isMounted', (args: SetMountedStatusParams) => this.setMountStatus(args));
  }

  private setMountStatus = (args: SetMountedStatusParams) => {
    if (!this || args.canvasId !== this.app.id) return;
    this.isMounted = args.status;
  };

  private linkState = (args: LinkStateParams) => {
    const { childId, parentId } = args;
    const child = this.states.get(childId);
    const parent = this.states.get(parentId);
    if (!child || !parent) return;
    (child.parent || this.view).children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);
  };

  private linkTransitions = (args: LinkTransitionParams) => {
    const { stateId } = args;
    this.transitions.forEachByStateId(stateId, (transition) =>
      this.transitions.linkTransition(transition.id)
    );
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
  removeSelection = () => {
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
  };
}
