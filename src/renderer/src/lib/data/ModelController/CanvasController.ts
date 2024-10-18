import { useSyncExternalStore } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import {
  AddDragendStateSig,
  ChangeComponentPosition,
  ChangeEventParams,
  ChangeNoteBackgroundColorParams,
  ChangeNoteFontSizeParams,
  ChangeNoteText,
  ChangeNoteTextColorParams,
  ChangePosition,
  ChangeSelectionParams,
  ChangeStateNameParams,
  ChangeStateParams,
  ChangeTransitionParams,
  ControllerDataPropertyName,
  CreateChoiceStateParams,
  CreateComponentParams,
  CreateEventActionParams,
  CreateEventParams,
  CreateFinalStateParams,
  CreateInitialStateControllerParams,
  CreateNoteParams,
  CreateStateMachineParams,
  CreateStateParams,
  CreateTransitionParams,
  DeleteDrawableParams,
  DeleteEventParams,
  DeleteStateMachineParams,
  EditComponentParams,
  emptyControllerListeners,
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
  | 'initialState'
  | 'stateMachine';

type DiagramData =
  | { [id: string]: State }
  | { [id: string]: InitialState }
  | { [id: string]: FinalState }
  | { [id: string]: ChoiceState }
  | { [id: string]: Transition }
  | { [name: string]: Component }
  | { [id: string]: Note }
  | { [id: string]: StateMachine };

export type CanvasControllerEvents = {
  loadData: null;
  initPlatform: null;
  initEvents: null;

  createTransitionFromController: {
    smId: string;
    sourceId: string;
    targetId: string;
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

  changeNoteFontSize: ChangeNoteFontSizeParams;
  changeNoteTextColor: ChangeNoteTextColorParams;
  changeNoteBackgroundColor: ChangeNoteBackgroundColorParams;
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
  changeState: ChangeStateParams;

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
  changeStateName: ChangeStateNameParams;
  changeFinalStatePosition: ChangePosition;
  deleteEventAction: DeleteEventParams;
  deleteStateMachine: DeleteStateMachineParams;
  createStateMachine: CreateStateMachineParams;
  openChangeTransitionModalFromController: { smId: string; id: string };
  setTextMode: boolean;
};

export type CanvasData = {
  platformNames: { [id: string]: string };
};

// Это разделение нужно при удалении машин состояний.
// scheme и common все равно контроллерам, если связанные с ними машины состояний удалят
// А specific становится не нужным, если его машину состояний удалят
// specific - канвас для работы с определенной машиной состояний
// scheme - схемотехнический экран
// common - для работы сразу со всеми машинами состояний
export type CanvasControllerType = 'specific' | 'scheme' | 'common';

export class CanvasController extends EventEmitter<CanvasControllerEvents> {
  // TODO: Сделать класс Subscriable
  dataListeners = emptyControllerListeners; //! Подписчиков обнулять нельзя, react сам разбирается
  app: CanvasEditor;
  __platform: { [id: string]: PlatformManager } = {};
  initializer: Initializer;
  states: StatesController;
  inited = false;
  transitions: TransitionsController;
  notes: NotesController;
  components: ComponentsController;
  stateMachines: StateMachineController;
  initData: { [id: string]: StateMachine } = {};
  canvasData: CanvasData;
  stateMachinesSub: { [id: string]: CanvasSubscribeAttribute[] } = {};
  id: string;
  scale = 1;
  offset = { x: 0, y: 0 }; // Нигде не меняется?
  isMounted = false;
  binded = {}; // Функции обработчики
  model: ModelController;
  type: CanvasControllerType;
  needToRewatchEdgeHandlers = false;
  visual = true;
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

  private subscribeToData =
    (propertyName: ControllerDataPropertyName) => (listener: () => void) => {
      if (!this.dataListeners[propertyName]) {
        this.dataListeners[propertyName] = [];
      }
      this.dataListeners[propertyName].push(listener);

      return () => {
        this.dataListeners[propertyName] = this.dataListeners[propertyName].filter(
          (l) => l !== listener
        );
      };
    };

  useData<T extends ControllerDataPropertyName>(propertyName: T): any {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(this.subscribeToData(propertyName), () => this[propertyName]);
  }

  setTextMode() {
    this.visual = false;
    this.states.updateAll();
    this.transitions.updateAll();
    this.triggerDataUpdate('visual');
  }

  triggerDataUpdate<T extends ControllerDataPropertyName>(...propertyNames: T[]) {
    for (const name of propertyNames) {
      // Ссылку нужно обновлять только у объектов
      const prevValue = this[name];
      if (typeof prevValue === 'object' && prevValue !== null) {
        this[name] = {
          ...prevValue,
        };
      }
      (this.dataListeners[name] ?? []).forEach((listener) => listener());
    }
  }

  setOffset(value: { x: number; y: number }) {
    this.offset = value;
  }

  addStateMachineId(smId: string) {
    if (this.stateMachinesSub[smId]) {
      return;
    }
    this.stateMachinesSub[smId] = [];
    this.triggerDataUpdate('stateMachinesSub');
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

  get platform() {
    return this.__platform;
  }

  init() {
    if (!this.inited) {
      for (const smId in this.initData) {
        // TODO: отрефакторить так, чтобы мы инициализировали только то, на что подписаны
        this.initializer.initComponents(smId, this.initData[smId].components);
        this.initializer.initStates(smId, this.initData[smId].states);
        this.initializer.initChoiceStates(smId, this.initData[smId].choiceStates);
        this.initializer.initFinalStates(smId, this.initData[smId].finalStates);
        this.initializer.initNotes(this.initData[smId].notes);
        this.initializer.initInitialStates(this.initData[smId].initialStates);
        this.initializer.initTransitions(smId, this.initData[smId].transitions);
      }
      if (this.type === 'scheme') {
        this.initializer.initStateMachines(this.initData);
      }
      this.inited = true;
    }

    if (this.needToRewatchEdgeHandlers) {
      // Это нужно, потому что после unmount удаляются
      // listeners событий мыши, на которые подписаны EdgeHandlers.
      // Но подписка на эти события происходит только в момент создания состояния.
      // Из-за чего EdgeHandler существует, но не подписан на события мыши.
      this.rewatchEdgeHandlers();
      this.needToRewatchEdgeHandlers = false;
    }
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
            this.model.off('changeState', this.binded['changeState']);
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
            this.model.off('changeNoteFontSize', this.binded['changeNoteFontSize']);
            this.model.off('changeNoteTextColor', this.binded['changeNoteTextColor']);
            this.model.off('changeNoteBackgroundColor', this.binded['changeNoteBackgroundColor']);
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
          case 'stateMachine':
            this.model.off('createStateMachine', this.binded['createStateMachine']);
            this.model.off('deleteStateMachine', this.binded['deleteStateMachine']);
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

  subscribe(smId: string, attribute: CanvasSubscribeAttribute, initData: DiagramData) {
    if (!this.stateMachinesSub[smId] || !this.model) {
      return;
    }
    if (this.stateMachinesSub[smId].includes(attribute)) {
      return;
    }

    if (!this.initData[smId]) {
      this.initData[smId] = emptyStateMachine();
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
          'changeState',
          this.bindHelper('state', 'changeState', this.states.changeState)
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
        this.initData[smId].states = {
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
        this.initData[smId].initialStates = {
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
        this.initData[smId].finalStates = {
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
        this.initData[smId].choiceStates = {
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
        this.model.on(
          'changeNoteFontSize',
          this.bindHelper('note', 'changeNoteFontSize', this.notes.changeNoteFontSize)
        );
        this.model.on(
          'changeNoteTextColor',
          this.bindHelper('note', 'changeNoteTextColor', this.notes.changeNoteTextColor)
        );
        this.model.on('changeNoteBackgroundColor', this.notes.changeNoteBackgroundColor);
        this.initData[smId].notes = {
          ...(initData as { [id: string]: Note }),
        };
        break;
      case 'component':
        if (!this.binded['createComponent']) {
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
        }
        this.initData[smId].components = {
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
        this.initData[smId].transitions = {
          ...(initData as { [id: string]: Transition }),
        };
        break;
      case 'stateMachine':
        if (!this.binded['createStateMachine']) {
          this.model.on(
            'createStateMachine',
            this.bindHelper('stateMachine', 'createStateMachine', this.createStateMachine)
          );
          this.model.on(
            'deleteStateMachine',
            this.bindHelper('stateMachine', 'deleteStateMachine', this.deleteStateMachine)
          );
        }
        if (!this.initData[smId]) {
          this.initData[smId] = emptyStateMachine();
        }
        break;
      default:
        throw new Error('Unknown attribute');
    }
  }

  rewatchEdgeHandlers() {
    for (const state of this.states.data.states.values()) {
      state.edgeHandlers.bindEvents();
    }
  }

  createStateMachine = (args: CreateStateMachineParams) => {
    const { smId, platform } = args;

    if (isPlatformAvailable(platform)) {
      const platformManager = loadPlatform(platform);
      if (typeof platformManager === 'undefined') {
        throw Error("couldn't init platform " + platform);
      }
      this.platform[smId] = platformManager;
    }
    this.stateMachines.createStateMachine(args);
  };

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
    if (!this.platform[args.smId]) {
      return;
    }
    const { id, newName, smId } = args;
    const visualCompo = this.platform[smId].nameToVisual.get(id);

    if (!visualCompo) return;

    this.platform[smId].nameToVisual.set(newName, visualCompo);
    this.platform[smId].nameToVisual.delete(id);

    if (this.visual) {
      // А сейчас будет занимательное путешествие по схеме с заменой всего
      this.states.forEachState((state) => {
        for (const ev of state.eventBox.data) {
          if (typeof ev.trigger !== 'string')
            if (ev.trigger.component == id) {
              // заменяем в триггере
              ev.trigger.component = newName;
              for (const act of ev.do) {
                if (typeof act !== 'string') {
                  // заменяем в действии
                  if (act.component == id) {
                    act.component = newName;
                  }
                }
              }
            }
        }
      });

      this.transitions.forEach((transition) => {
        if (!transition.data.label) return;

        if (
          typeof transition.data.label.trigger !== 'string' &&
          transition.data.label.trigger?.component === id
        ) {
          transition.data.label.trigger.component = newName;
        }

        if (transition.data.label.do) {
          for (const act of transition.data.label.do) {
            if (typeof act !== 'string') {
              if (act.component === id) {
                act.component = newName;
              }
            }
          }
        }

        if (
          typeof transition.data.label.condition !== 'string' &&
          transition.data.label.condition
        ) {
          this.renameCondition(transition.data.label.condition, id, newName);
        }
      });
    }

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
    if (!this.platform[args.smId]) {
      return;
    }
    if (this.type === 'scheme') {
      this.components.editComponent(args);
    }
    this.platform[args.smId].nameToVisual.set(args.id, {
      component: args.type,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    });
  };

  private deleteComponent(args: DeleteDrawableParams) {
    if (!this.platform[args.smId]) {
      return;
    }

    if (this.type === 'scheme') {
      this.components.deleteComponent(args);
      this.stateMachines.deleteComponent(args.smId, args.id);
    }
    this.platform[args.smId].nameToVisual.delete(args.id);
  }

  createComponent = (args: CreateComponentParams) => {
    if (!this.platform[args.smId]) {
      return;
    }
    this.platform[args.smId].nameToVisual.set(args.name, {
      component: args.type,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    });

    if (this.type !== 'scheme') return;

    const component = this.components.createComponent(args);

    if (!component) return;

    this.stateMachines.addComponent(args.smId, component);
  };

  initPlatform = () => {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    for (const smId in this.canvasData.platformNames) {
      const platformName = this.canvasData.platformNames[smId];

      if (isPlatformAvailable(platformName)) {
        const platform = loadPlatform(platformName);
        if (typeof platform === 'undefined') {
          throw Error("couldn't init platform " + platformName);
        }
        this.platform[smId] = platform;
      }
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

  deleteStateMachine = (args: DeleteStateMachineParams) => {
    const { id, stateMachine } = args;
    if (!this.stateMachinesSub[id]) return;

    Object.keys(stateMachine.transitions).map((transitionId) => {
      this.transitions.deleteTransition({ smId: id, id: transitionId });
    });

    Object.keys(stateMachine.states).map((stateId) => {
      this.states.deleteState({ smId: id, id: stateId });
    });

    Object.keys(stateMachine.finalStates).map((stateId) => {
      this.states.deleteFinalState({ smId: id, id: stateId });
    });

    Object.keys(stateMachine.choiceStates).map((stateId) => {
      this.states.deleteChoiceState({ smId: id, id: stateId });
    });

    Object.keys(stateMachine.initialStates).map((stateId) => {
      this.states.deleteInitialState({ smId: id, id: stateId });
    });

    Object.keys(stateMachine.notes).map((noteId) => {
      this.notes.deleteNote({ smId: id, id: noteId });
    });

    this.stateMachines.deleteStateMachine(args);

    delete this.stateMachinesSub[id];

    this.triggerDataUpdate('stateMachinesSub');
  };

  // Отлавливание дефолтных событий для контроллера
  watch() {
    this.model.on('deleteStateMachine', this.deleteStateMachine);
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

    this.app.controller.stateMachines.forEach((stateMachine) => {
      stateMachine.setIsSelected(false);
    });

    this.view.isDirty = true;
  };
}
