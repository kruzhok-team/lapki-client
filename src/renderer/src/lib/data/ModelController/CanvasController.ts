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
  EditStateMachine,
  emptyControllerListeners,
  Layer,
  LinkStateParams,
  LinkTransitionParams,
  RenameComponentParams,
  SelectDrawable,
  UnlinkStateParams,
} from '@renderer/lib/types';
import {
  ChoiceState,
  Component,
  emptyStateMachine,
  FinalState,
  InitialState,
  Note,
  State,
  StateMachine,
  Transition,
} from '@renderer/types/diagram';

import { ComponentsController } from './ComponentsController';
import { ModelController } from './ModelController';
import { NotesController } from './NotesController';
import { StateMachineController } from './StateMachineController';
import { StatesController } from './StatesController';
import { TransitionsController } from './TransitionsController';

import { Initializer } from '../Initializer';
import { isPlatformAvailable, loadPlatform } from '../PlatformLoader';
import { ComponentEntry, PlatformManager } from '../PlatformManager';

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
  unlinkChoiceState: UnlinkStateParams;
  changeStateName: ChangeStateNameParams;
  changeFinalStatePosition: ChangePosition;
  deleteEventAction: DeleteEventParams;
  deleteStateMachine: DeleteStateMachineParams;
  createStateMachine: CreateStateMachineParams;
  openChangeTransitionModalFromController: { smId: string; id: string };
  setTextMode: boolean;
  editStateMachine: EditStateMachine;
  changeStateMachinePosition: ChangePosition;
  changeTransitionPositionFromController: ChangePosition;
  changeNotePositionFromController: ChangePosition;
  changeChoicePositionFromController: ChangePosition;
  changeFinalPositionFromController: ChangePosition;
};

export type CanvasData = {
  platformNames: { [id: string]: string };
};

/* 
  Это разделение нужно при удалении машин состояний.
  scheme и common все равно, если связанные с ними машины состояний удалят
  А specific становится не нужным, если его машину состояний удалят
  specific - канвас для работы с определенной машиной состояний
  scheme - схемотехнический экран
  common - для работы сразу со всеми машинами состояний
*/
export type CanvasControllerType = 'specific' | 'scheme' | 'common';

export class CanvasController extends EventEmitter<CanvasControllerEvents> {
  // TODO: Сделать класс Subscribable
  dataListeners = emptyControllerListeners; //! Подписчиков обнулять нельзя, react сам разбирается
  app: CanvasEditor;
  platform: { [id: string]: PlatformManager } = {};
  initializer: Initializer;
  states: StatesController;
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
  visual = true;
  hierarchyViews: CanvasSubscribeAttribute[];
  constructor(
    id: string,
    type: CanvasControllerType,
    app: CanvasEditor,
    canvasData: CanvasData,
    model: ModelController,
    hierarchyViews: CanvasSubscribeAttribute[]
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
    this.hierarchyViews = hierarchyViews;
    this.initPlatform();
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
      if (!this.stateMachinesSub[smId]) {
        return () => null;
      }
      if (!this.stateMachinesSub[smId].includes(attribute)) {
        return () => null;
      }
    }

    return callback(parameters);
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
            this.model.off('deleteEvent', this.binded['deleteEvent']);
            break;
          case 'initialState':
            this.model.off('createInitial', this.binded['createInitial']);
            this.model.off('changeInitialPosition', this.binded['changeInitialPosition']);
            this.model.off('deleteInitialState', this.binded['deleteInitialState']);
            break;
          case 'final':
            this.model.off('createFinal', this.binded['createFinal']);
            this.model.off('deleteFinal', this.binded['deleteFinal']);
            this.model.off('changeFinalStatePosition', this.binded['changeFinalStatePosition']);
            this.model.off('linkFinalState', this.binded['linkFinalState']);
            break;
          case 'choice':
            this.model.off('createChoice', this.binded['createChoice']);
            this.model.off('deleteChoice', this.binded['deleteChoice']);
            this.model.off('selectState', this.binded['selectState']);
            this.model.off('linkChoiceState', this.binded['linkChoiceState']);
            this.model.off('changeChoicePosition', this.binded['changeChoicePosition']);
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
            break;
          case 'component':
            this.model.off('createComponent', this.binded['createComponent']);
            this.model.off('deleteComponent', this.binded['deleteComponent']);
            this.model.off('editComponent', this.binded['editComponent']);
            this.model.off('renameComponent', this.binded['renameComponent']);
            this.model.off('selectComponent', this.binded['selectComponent']);
            this.model.off('changeComponentSelection', this.binded['changeComponentSelection']);
            this.model.off('changeComponentPosition', this.binded['changeComponentPosition']);
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
            break;
          case 'stateMachine':
            this.model.off('createStateMachine', this.binded['createStateMachine']);
            this.model.off('deleteStateMachine', this.binded['deleteStateMachine']);
            this.model.off('editStateMachine', this.binded['editStateMachine']);
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
  }

  watchDrawable() {
    this.states.watchAll();
    this.states.bindAll();
    this.transitions.watchAll();
    this.notes.watchAll();
  }

  unwatchDrawable() {
    this.states.unwatchAll();
    this.transitions.unwatchAll();
    this.notes.unwatchAll();
  }

  setScale = (value: number) => {
    this.scale = value;
    this.view.isDirty = true;
    this.triggerDataUpdate('scale');
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
        this.model.on(
          'deleteEvent',
          this.bindHelper('state', 'deleteEvent', this.states.deleteEvent)
        );
        this.initializer.initStates(smId, initData as { [id: string]: State });
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
        this.initializer.initInitialStates(smId, initData as { [id: string]: InitialState });
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
        this.initializer.initFinalStates(smId, initData as { [id: string]: FinalState });
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
        this.initializer.initChoiceStates(smId, initData as { [id: string]: ChoiceState });
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
        this.model.on('changeNoteSelection', this.notes.changeNoteSelection);
        this.initializer.initNotes(smId, initData as { [id: string]: Note });
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
          this.model.on(
            'changeComponentSelection',
            this.bindHelper(
              'component',
              'changeComponentSelection',
              this.components.changeComponentSelection
            )
          );
          this.model.on(
            'changeComponentPosition',
            this.bindHelper(
              'component',
              'changeComponentPosition',
              this.components.changeComponentPosition
            )
          );
        }
        this.initializer.initComponents(smId, {
          ...(initData as { [id: string]: Component }),
        });
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
        this.initializer.initTransitions(smId, initData as { [id: string]: Transition });
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
          this.model.on(
            'editStateMachine',
            this.bindHelper('stateMachine', 'editStateMachine', this.stateMachines.editStateMachine)
          );
        }
        if (initData[smId] && (initData[smId] as StateMachine).position) {
          this.initData[smId].position = (initData[smId] as StateMachine).position;
          this.initData[smId].name = (initData[smId] as StateMachine).name;
          this.loadPlatform(smId, (initData[smId] as StateMachine).platform);
          this.initializer.initStateMachines({ [smId]: initData[smId] as StateMachine });
        }
        break;
      default:
        throw new Error('Unknown attribute');
    }
  }

  rewatchEdgeHandlers() {
    // TODO(L140-beep): Вот с этим надо что-то делать, иначе плодиться будет только так
    for (const state of this.states.data.states.values()) {
      this.states.bindEdgeHandlers(state);
    }
    for (const state of this.states.data.choiceStates.values()) {
      this.states.bindEdgeHandlers(state);
    }
    for (const note of this.notes.items.values()) {
      this.notes.bindEdgeHandlers(note);
    }
  }

  // TODO (L140-beep): Скорее всего, нужно будет отнести это в ModelController
  // Компоненты передаем, чтобы отсеять уже добавленные синглтоны
  getVacantComponents(smId: string, components: { [id: string]: Component }) {
    if (!this.platform[smId]) return [];

    const vacant: ComponentEntry[] = [];
    const platform: PlatformManager = this.platform[smId];
    if (!platform) return;

    for (const idx in platform.data.components) {
      const compo = platform.data.components[idx];
      if ((compo.singletone || platform.data.staticComponents) && components.hasOwnProperty(idx))
        continue;
      vacant.push({
        idx,
        name: compo.name ?? idx,
        img: compo.img ?? 'unknown',
        description: compo.description ?? '',
        singletone: compo.singletone ?? false,
      });
    }

    return vacant;
  }

  createStateMachine = (args: CreateStateMachineParams) => {
    const { smId, platform } = args;
    if (!this.platform[smId]) {
      this.loadPlatform(smId, platform);
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
    const { id, newId, smId } = args;
    const visualCompo = this.platform[smId].nameToVisual.get(id);

    if (!visualCompo) return;

    this.platform[smId].nameToVisual.set(newId, visualCompo);
    this.platform[smId].nameToVisual.delete(id);

    this.components.renameComponent(args);

    this.triggerDataUpdate('platform');
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
    this.components.changeComponentSelection({ ...args, value: true });
    this.removeSelection();
    this.emit('selectComponent', { id: args.id, smId: args.smId });
  };

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
    this.view.isDirty = true;
    this.triggerDataUpdate('platform');

    this.view.isDirty = true;
  };

  deleteComponent = (args: DeleteDrawableParams) => {
    if (!this.platform[args.smId]) {
      return;
    }

    if (this.type === 'scheme') {
      this.components.deleteComponent(args);
      this.stateMachines.deleteComponent(args.smId, args.id);
    }
    this.platform[args.smId].nameToVisual.delete(args.id);
    this.triggerDataUpdate('platform');

    this.view.isDirty = true;
  };

  createComponent = (args: CreateComponentParams) => {
    if (!this.platform[args.smId]) {
      return;
    }
    this.platform[args.smId].nameToVisual.set(args.id, {
      component: args.type,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    });
    this.triggerDataUpdate('platform');

    this.view.isDirty = true;

    if (this.type !== 'scheme') return;

    const component = this.components.createComponent(args);

    if (!component) return;

    this.stateMachines.addComponent(args.smId, component);
  };

  loadPlatform(smId: string, platformName: string) {
    if (isPlatformAvailable(platformName)) {
      const platform = loadPlatform(platformName);
      if (typeof platform === 'undefined') {
        throw Error("couldn't init platform " + platformName);
      }
      platform.picto = this.view.picto;
      this.platform[smId] = platform;
      this.triggerDataUpdate('platform');
    }
  }

  initPlatform = () => {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    for (const smId in this.canvasData.platformNames) {
      const platformName = this.canvasData.platformNames[smId];
      this.loadPlatform(smId, platformName);
    }
    this.triggerDataUpdate('platform');
    //! Инициализировать компоненты нужно сразу после загрузки платформы
    // Их инициализация не создает отдельными сущности на холсте а перерабатывает данные в удобные структуры
  };

  loadData = () => {
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
    this.model.on('loadData', this.loadData);
    this.model.on('initEvents', this.transitions.initEvents);
    this.model.on('deleteSelected', this.deleteSelected);
  }

  setMountStatus = (status: boolean) => {
    this.isMounted = status;
    this.triggerDataUpdate('isMounted');
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
