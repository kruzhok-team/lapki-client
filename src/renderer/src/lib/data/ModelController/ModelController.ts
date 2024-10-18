import { Point } from 'electron';

import { StateMachineData } from '@renderer/components/StateMachineEditModal';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import {
  CHILDREN_PADDING,
  INITIAL_STATE_OFFSET,
  PASTE_POSITION_OFFSET_STEP,
} from '@renderer/lib/constants';
import { History } from '@renderer/lib/data/History';
import {
  CCreateInitialStateParams,
  CopyData,
  CopyType,
  EditComponentParams,
  LinkStateParams,
  SetMountedStatusParams,
  StatesControllerDataStateType,
  UnlinkStateParams,
} from '@renderer/lib/types/ControllerTypes';
import {
  ChangeEventParams,
  ChangeNoteBackgroundColorParams,
  ChangeNoteFontSizeParams,
  ChangeNoteText,
  ChangeNoteTextColorParams,
  ChangePosition,
  ChangeStateParams,
  ChangeTransitionParams,
  CreateChoiceStateParams,
  CreateComponentParams,
  CreateEventActionParams,
  CreateEventParams,
  CreateFinalStateParams,
  CreateNoteParams,
  CreateStateParams,
  CreateTransitionParams,
  DeleteDrawableParams,
  DeleteEventParams,
  SwapComponentsParams,
} from '@renderer/lib/types/ModelTypes';
import { generateId, isPointInRectangle } from '@renderer/lib/utils';
import {
  Elements,
  StateMachine,
  ChoiceState,
  Transition,
  Note,
  InitialState,
  State,
  FinalState,
  emptyStateMachine,
  Action,
} from '@renderer/types/diagram';

import { CanvasController, CanvasControllerEvents } from './CanvasController';

import { EditorModel } from '../EditorModel';
import { FilesManager } from '../EditorModel/FilesManager';
import { isPlatformAvailable, loadPlatform } from '../PlatformLoader';
import { ComponentEntry, PlatformManager } from '../PlatformManager';

/**
 * Общий контроллер машин состояний.
 * Хранит все данные о всех машинах состояний, предоставляет интерфейс
 * для работы с ними. Не отвечает за графику и события (эта логика
 * вынесена в контроллеры)
 *
 * @remarks
 * Все изменения, вносимые на уровне данных, должны происходить
 * здесь. Сюда закладывается история правок, импорт и экспорт.
 */

// FIXME: оптимизация: в сигнатуры функций можно поставить что-то типа (string | State),
//        чтобы через раз не делать запрос в словарь

// TODO Образовалось массивное болото, что не есть хорошо, надо додумать чем заменить переборы этих массивов.

type ModelControllerEvents = CanvasControllerEvents & {
  openCreateTransitionModal: { smId: string; sourceId: string; targetId: string };
  openChangeTransitionModal: ChangeTransitionParams;
};

const StateTypes = ['states', 'finalStates', 'choiceStates', 'initialStates'] as const;
type StateType = (typeof StateTypes)[number];

export class ModelController extends EventEmitter<ModelControllerEvents> {
  public static instance: ModelController | null = null;
  //! Порядок создания важен, так как контроллер при инициализации использует представление
  model = new EditorModel(
    () => {
      this.initPlatform();
    },
    () => {
      this.loadData();
      this.history.clear();
    },
    (scale: number) => {
      this.emit('changeScale', scale);
    }
  );
  schemeEditorId: string | null = null;
  files = new FilesManager(this);
  history = new History(this);
  vacantComponents: { [id: string]: ComponentEntry[] } = {};
  platforms: { [id: string]: PlatformManager } = {};
  // По умолчанию главным считается "призрачный" канвас.
  // Он нужен, потому что нам требуется наличие канваса в момент запуска приложения
  controllers: { [id: string]: CanvasController } = {};
  private copyData: CopyData | null = null; // То что сейчас скопировано
  private pastePositionOffset = 0; // Для того чтобы при вставке скопированной сущности она не перекрывала предыдущую

  constructor() {
    super();

    this.emptyController();
    ModelController.instance = this;
  }

  // Создаем пустой контроллер с пустыми данными и назначаем его главным
  emptyController() {
    const editor = new CanvasEditor('');
    const controller = new CanvasController(
      '',
      'specific',
      editor,
      { platformNames: { '': '' } },
      this
    );
    controller.addStateMachineId('');
    this.model.data.elements.stateMachines[''] = emptyStateMachine();
    editor.setController(controller);
    this.controllers = {};
    this.controllers[''] = controller;
    this.model.data.canvas[''] = { isInitialized: false, isMounted: false, prevMounted: false };
    this.model.changeHeadControllerId('');
    this.schemeEditorId = null;
  }

  reset() {
    for (const controllerId in this.controllers) {
      if (this.model.data.canvas[controllerId].isMounted) {
        const controller = this.controllers[controllerId];
        this.unwatch(controller);
      }
    }
    this.emptyController();
  }

  // Берем машины состояний, который обрабатываются главным канвасом
  getHeadControllerStateMachines() {
    const stateMachines: { [id: string]: StateMachine } = {};
    const controller = this.controllers[this.model.data.headControllerId];
    for (const stateMachineId in controller.stateMachinesSub) {
      const sm = this.model.data.elements.stateMachines[stateMachineId];
      if (!sm) continue;
      stateMachines[stateMachineId] = sm;
    }

    return stateMachines;
  }

  setupSchemeScreenEditorController(
    smIds: { [id: string]: StateMachine },
    controller: CanvasController
  ) {
    for (const smId in smIds) {
      const sm = smIds[smId];
      if (smId === '') continue;
      if (!sm) return;
      const smToSubscribe = {};
      smToSubscribe[smId] = emptyStateMachine();
      controller.addStateMachineId(smId);
      controller.subscribe(smId, 'stateMachine', {});
      controller.subscribe(smId, 'component', sm.components);
    }
    controller.watch();
  }

  // Подписываем контроллер на нужные нам данные
  setupDiagramEditorController(smId: string, controller: CanvasController) {
    const sm = this.model.data.elements.stateMachines[smId];
    if (!sm) return;
    // const controller = new CanvasController(generateId(), app, { platformName: sm.platform });
    controller.addStateMachineId(smId);
    controller.subscribe(smId, 'choice', sm.choiceStates);
    controller.subscribe(smId, 'final', sm.finalStates);
    controller.subscribe(smId, 'state', sm.states);
    controller.subscribe(smId, 'note', sm.notes);
    controller.subscribe(smId, 'transition', sm.transitions);
    controller.subscribe(smId, 'initialState', sm.initialStates);
    controller.subscribe(smId, 'component', sm.components);
    controller.watch();
    // return controller;
  }

  // Подписываемся на события контроллера
  // Большинство событий исходит от ModelController, но сигналы, связаные с событиями, отслеживаемыми в Shape,
  // такие как клик, двойной клик перемещением в определенное место, вызываются в контроллерах
  private watch(controller: CanvasController) {
    controller.on('isMounted', this.setMountStatus);
    controller.on('linkState', this.linkState);
    controller.on('selectState', this.selectState);
    controller.on('createTransitionFromController', this.onCreateTransitionModal);
    controller.on('openChangeTransitionModalFromController', this.openChangeTransitionModal);
  }

  private openChangeTransitionModal = (args: { smId: string; id: string }) => {
    const { smId, id } = args;
    const transition = this.model.data.elements.stateMachines[smId].transitions[id];
    if (!transition) return;
    this.emit('openChangeTransitionModal', { ...args, ...transition });
  };

  private unwatch(controller: CanvasController) {
    controller.off('isMounted', this.setMountStatus);
    controller.off('linkState', this.linkState);
    controller.off('selectState', this.selectState);
    controller.off('createTransitionFromController', this.onCreateTransitionModal);
    controller.off('openChangeTransitionModalFromController', this.openChangeTransitionModal);
    controller.unwatch();
  }

  private onCreateTransitionModal = (args: {
    smId: string;
    sourceId: string;
    targetId: string;
  }) => {
    this.emit('openCreateTransitionModal', args);
  };

  private setMountStatus = (args: SetMountedStatusParams) => {
    const canvas = this.model.data.canvas[args.canvasId];
    if (!canvas) {
      return;
    }
    canvas.isMounted = args.status;
    this.model.triggerDataUpdate('canvas.isMounted');
  };

  initPlatform() {
    //TODO (L140-beep): исправить то, что платформы загружаются и в ModelController, и в CanvasController
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      const platform = loadPlatform(sm.platform);
      if (platform) {
        this.platforms[platform.name] = platform;
      }
    }
    this.emit('initPlatform', null);
  }

  changeNoteFontSize(args: ChangeNoteFontSizeParams) {
    const { id, smId, fontSize } = args;
    const sm = this.model.data.elements.stateMachines[smId];
    const note = sm.notes[id];
    if (!note) return;

    this.model.changeNoteFontSize(smId, id, fontSize);

    this.emit('changeNoteFontSize', args);
    // TODO: History
  }

  changeNoteTextColor(args: ChangeNoteTextColorParams) {
    const { id, smId, textColor } = args;
    const sm = this.model.data.elements.stateMachines[smId];
    const note = sm.notes[id];
    if (!note) return;

    this.model.changeNoteTextColor(smId, id, textColor);

    this.emit('changeNoteTextColor', args);
    // TODO: History
  }

  changeNoteBackgroundColor(args: ChangeNoteBackgroundColorParams) {
    const { id, smId, backgroundColor } = args;
    const sm = this.model.data.elements.stateMachines[smId];
    const note = sm.notes[id];
    if (!note) return;

    this.model.changeNoteBackgroundColor(smId, id, backgroundColor);

    this.emit('changeNoteBackgroundColor', args);
    // TODO: History
  }

  initData(basename: string | null, filename: string, elements: Elements) {
    this.reset();
    this.model.init(basename, filename, elements);
    this.controllers[''].unwatch();
    let headCanvas = '';
    for (const smId in elements.stateMachines) {
      if (smId === '') continue;
      const canvasId = this.createStateMachine(smId, elements.stateMachines[smId]);
      headCanvas = canvasId;
      this.model.data.canvas[canvasId] = {
        isInitialized: true,
        isMounted: false,
        prevMounted: false,
      };
    }
    this.model.changeHeadControllerId(headCanvas);
    this.model.makeStale();
    this.createSchemeScreenController(elements.stateMachines);
    this.history.clear();
    this.model.initCanvasData();
    this.initPlatform();
  }

  createSchemeScreenController(stateMachines: { [id: string]: StateMachine }) {
    const schemeScreenId = generateId();
    const editor = new CanvasEditor(schemeScreenId);
    const platforms: { [id: string]: string } = {};

    for (const smId in stateMachines) {
      if (smId === '') continue;
      const sm = stateMachines[smId];
      platforms[smId] = sm.platform;
    }

    const schemeScreenController = new CanvasController(
      schemeScreenId,
      'scheme',
      editor,
      {
        platformNames: platforms,
      },
      this
    );
    editor.setController(schemeScreenController);
    this.controllers[schemeScreenId] = schemeScreenController;
    this.model.data.canvas[schemeScreenId] = {
      isInitialized: true,
      isMounted: false,
      prevMounted: false,
    };
    this.watch(schemeScreenController);
    this.setupSchemeScreenEditorController(stateMachines, schemeScreenController);
    this.schemeEditorId = schemeScreenId;
    return schemeScreenId;
  }

  loadData() {
    this.emit('loadData', null);
  }

  private getSmId(id: string, element: `${keyof StateMachine}`) {
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      const elements = sm[element];
      if (elements && elements[id]) {
        return smId;
      }
    }
    throw new Error('Never is reached');
  }

  // TODO: Думаю, из-за этого не очень хорошо компоненты выделяются
  selectComponent(id: string) {
    this.removeSelection();

    // TODO: Откуда брать id машины состояний? UPDATE: Доделать
    this.model.changeComponentSelection(this.getSmId(id, 'components'), id, true);
    this.emit('selectComponent', { id: id, smId: '' });
  }

  createComponent(args: CreateComponentParams) {
    this.model.createComponent(args);
    this.emit('createComponent', args);
    // if (canUndo) {
    //   this.history.do({
    //     type: 'createComponent',
    //     args: { args },
    //   });
    // }
  }

  createNote(args: CreateNoteParams, canUndo = true) {
    const newId = this.model.createNote(args);

    this.emit('createNote', { ...args, id: newId });
    if (canUndo) {
      this.history.do({
        type: 'createNote',
        args: { smId: args.smId, id: newId, params: args },
      });
    }
  }

  changeTransition(args: ChangeTransitionParams, canUndo = true) {
    const transition = this.model.data.elements.stateMachines[args.smId].transitions[args.id];
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'changeTransition',
        args: { args, prevData: structuredClone(transition) },
      });
    }

    this.emit('changeTransition', args);
  }

  changeTransitionPosition(args: ChangePosition, canUndo = true) {
    const { smId, id, startPosition, endPosition } = args;

    const transition = this.model.data.elements.stateMachines[args.smId][args.id];
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'changeTransitionPosition',
        args: { smId, id, startPosition: startPosition ?? { x: 0, y: 0 }, endPosition },
      });
    }

    this.model.changeTransitionPosition(smId, id, endPosition);

    this.emit('changeTransitionPosition', args);
  }
  // Флаг withInitial нужен, когда мы автоматически создаем переход из начального состояния
  createTransition(params: CreateTransitionParams, withInitial: boolean = false, canUndo = true) {
    const { sourceId, targetId, color, id: prevId, label, smId } = params;
    const sm = this.model.data.elements.stateMachines[smId];
    //TODO: (XidFanSan) где-то должна быть проверка, что цель может быть не-состоянием, только если источник – заметка.
    const source =
      sm.states[sourceId] ||
      sm.notes[sourceId] ||
      sm.initialStates[sourceId] ||
      sm.choiceStates[sourceId];
    const target =
      sm.states[targetId] ||
      sm.notes[targetId] ||
      sm.choiceStates[targetId] ||
      sm.transitions[targetId];

    if (!source || !target) return;

    if (label && !label.position) {
      label.position = {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      };
    }

    // Создание данных
    const newId = this.model.createTransition({
      smId,
      id: prevId,
      sourceId,
      targetId,
      color,
      label,
    });
    if (withInitial) {
      this.emit('createTransitionFromInitialState', { ...params, id: newId });
      return;
    }
    this.emit('createTransition', { ...params, id: newId });
    if (canUndo) {
      this.history.do({
        type: 'createTransition',
        args: { smId, id: newId, params: params },
      });
    }
  }

  getAllByTargetId(smId: string, id: string | string[]): [Transition[], string[]] {
    const sm = this.model.data.elements.stateMachines[smId];
    const transitions: Transition[] = [];
    const ids: string[] = [];
    for (const transitionId in sm.transitions) {
      const transition = sm.transitions[transitionId];
      if (transition.targetId === id || (Array.isArray(id) && id.includes(transition.targetId))) {
        transitions.push(transition);
        ids.push(transitionId);
      }
    }
    return [transitions, ids];
  }

  private getSiblings(
    smId: string,
    stateId: string | undefined,
    parentId: string | undefined,
    stateType: StatesControllerDataStateType = 'states'
  ): [(State | ChoiceState | InitialState)[], string[]] {
    const siblings: (State | ChoiceState | InitialState)[] = [];
    const siblingIds: string[] = [];
    for (const value of Object.entries(this.model.data.elements.stateMachines[smId][stateType])) {
      const [id, state] = value;
      if (state.parentId === parentId && id !== stateId) {
        siblings.push(state);
        siblingIds.push(id);
      }
    }
    return [siblings, siblingIds];
  }

  /**
   * Назначить состояние начальным
   * TODO(bryzZz) Очень сложно искать переход из начального состояния в обычное состояние
   */
  setInitialState(smId: string, stateId: string, canUndo = true) {
    const sm = this.model.data.elements.stateMachines[smId];
    const state = sm.states[stateId];
    if (!state) return;
    // Проверка на то что состояние уже является, тем на которое есть переход из начального
    const stateTransitions = this.getAllByTargetId(smId, stateId)[0] ?? [];
    if (stateTransitions.find(({ sourceId }) => sm.initialStates[sourceId] !== undefined)) return;

    const siblingsIds = this.getSiblings(smId, stateId, state.parentId, 'states')[1];
    const [siblingsTransitions, siblingIds] = this.getAllByTargetId(smId, siblingsIds);
    let id: string | undefined = undefined;
    const transitionFromInitialState = siblingsTransitions.find((transition, index) => {
      id = siblingIds[index];
      return sm.initialStates[transition.sourceId] !== undefined;
    });

    if (!transitionFromInitialState || !id) return;

    const initialState = sm.initialStates[transitionFromInitialState.sourceId];

    const position = {
      x: state.position.x - INITIAL_STATE_OFFSET,
      y: state.position.y - INITIAL_STATE_OFFSET,
    };

    if (state.parentId) {
      position.x = Math.max(0, position.x);
      position.y = Math.max(0, position.y);
    }

    if (canUndo) {
      this.history.do({
        type: 'changeTransition',
        args: {
          args: { smId, id, ...transitionFromInitialState, targetId: stateId },
          prevData: structuredClone({ ...transitionFromInitialState }),
        },
      });
    }

    this.model.changeTransition({
      ...transitionFromInitialState,
      smId: smId,
      id: id,
      targetId: stateId,
    });

    this.emit('changeTransition', {
      ...transitionFromInitialState,
      smId: smId,
      id: id,
      targetId: stateId,
    });

    this.changeInitialStatePosition(smId, id, initialState.position, position, canUndo);
  }

  createStateMachine(smId: string, data: StateMachine) {
    const canvasId = generateId();
    const editor = new CanvasEditor(canvasId);
    const controller = new CanvasController(
      canvasId,
      'specific',
      editor,
      {
        platformNames: { [smId]: data.platform },
      },
      this
    );
    editor.setController(controller);
    this.controllers[canvasId] = controller;
    this.model.data.canvas[canvasId] = {
      isInitialized: true,
      isMounted: false,
      prevMounted: false,
    };
    this.model.createStateMachine(smId, data);
    this.watch(controller);
    this.setupDiagramEditorController(smId, controller);
    if (this.schemeEditorId) {
      const schemeController = this.controllers[this.schemeEditorId];
      this.setupSchemeScreenEditorController(
        { [smId]: this.model.data.elements.stateMachines[smId] },
        schemeController
      );
    }
    this.emit('createStateMachine', {
      smId,
      name: data.name,
      platform: data.platform,
      position: data.position,
    });

    return canvasId;
  }

  editStateMachine(smId: string, data: StateMachineData) {
    this.model.editStateMachine(smId, data);
    // TODO: emit('editStateMachine', data)
  }

  deleteStateMachine(smId: string) {
    const sm = { ...this.model.data.elements.stateMachines[smId] };
    // Сделать общий канвас канвасом по умолчанию?
    this.model.deleteStateMachine(smId);
    this.emit('deleteStateMachine', {
      id: smId,
      stateMachine: sm,
    });
  }

  changeInitialStatePosition(
    smId: string,
    id: string,
    startPosition: Point,
    endPosition: Point,
    canUndo = true
  ) {
    const sm = this.model.data.elements.stateMachines[smId];
    const state = sm.initialStates[id];
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeInitialStatePosition',
        args: { smId, id, startPosition, endPosition },
      });
    }

    this.model.changeInitialStatePosition(smId, id, endPosition);
    this.emit('changeInitialPosition', { smId, id, startPosition, endPosition });
  }

  changeStatePosition(
    smId: string,
    id: string,
    startPosition: Point,
    endPosition: Point,
    canUndo = true
  ) {
    const sm = this.model.data.elements.stateMachines[smId];
    const state = sm.states[id];
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStatePosition',
        args: { smId, id, startPosition, endPosition },
      });
    }

    this.model.changeStatePosition(smId, id, endPosition);
    this.emit('changeStatePosition', { smId, id, startPosition, endPosition });
  }

  getBySourceId(smId: string, sourceId: string) {
    return [...Object.entries(this.model.data.elements.stateMachines[smId].transitions)].find(
      (transition) => transition[1].sourceId === sourceId
    );
  }

  private deleteInitialStateWithTransition(smId: string, initialStateId: string, canUndo = true) {
    const transitionWithId = this.getBySourceId(smId, initialStateId);
    if (!transitionWithId) return;

    this.deleteTransition({ smId, id: transitionWithId[0] }, canUndo);

    this.deleteInitialState({ smId, id: initialStateId }, canUndo);
  }

  deleteInitialState(args: DeleteDrawableParams, canUndo = true) {
    const { smId, id } = args;

    const state = this.model.data.elements.stateMachines[smId].initialStates[id];
    if (!state) return;

    this.model.deleteInitialState(smId, id); // Удаляем модель

    if (canUndo) {
      this.history.do({
        type: 'deleteInitialState',
        args: args,
      });
    }
    this.emit('deleteInitialState', args);
  }

  changeNoteText = (args: ChangeNoteText, canUndo = true) => {
    const { id, smId, text } = args;
    const note = this.model.data.elements.stateMachines[smId].notes[id];
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'changeNoteText',
        args: { smId, id, text, prevText: note.text },
      });
    }

    this.model.changeNoteText(smId, id, text);
    this.emit('changeNoteText', args);
  };

  changeNotePosition(args: ChangePosition, canUndo = true) {
    const { id, smId, startPosition, endPosition } = args;
    const note = this.model.data.elements.stateMachines[smId].notes[smId];
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'changeNotePosition',
        args: { smId, id, startPosition: startPosition ?? { x: 0, y: 0 }, endPosition },
      });
    }

    this.model.changeNotePosition(smId, id, endPosition);

    this.emit('changeNotePosition', args);
  }

  deleteNote(args: DeleteDrawableParams, canUndo = true) {
    const { id, smId } = args;
    const note = this.model.data.elements.stateMachines[smId].notes[smId];
    if (!note) return;

    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    const dependetTransitionsIds = this.getAllByTargetId(smId, id)[1];
    dependetTransitionsIds.forEach((transitionId) => {
      this.deleteTransition({ smId, id: transitionId }, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteNote',
        args: { smId, id, prevData: structuredClone(note) },
        numberOfConnectedActions,
      });
    }

    this.model.deleteNote(smId, id);
    this.emit('deleteNote', args);
  }

  deleteTransition(args: DeleteDrawableParams, canUndo = true) {
    const { smId, id } = args;

    const transition = this.model.data.elements.stateMachines[smId].transitions[id];
    if (!transition) return;

    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    const dependetTransitions = this.getAllByTargetId(smId, id)[1];

    dependetTransitions.forEach((transitionId) => {
      this.deleteTransition({ smId, id: transitionId }, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteTransition',
        args: { smId, id: id, prevData: structuredClone(transition) },
        numberOfConnectedActions,
      });
    }
    this.model.deleteTransition(smId, id);
    this.emit('deleteTransition', args);
  }

  private getDrawBounds(smId: string, stateId: string) {
    return {
      ...this.getComputedPosition(smId, stateId, 'states'),
      ...this.getComputedDimensions(smId, stateId, 'states'),
    };
  }

  isUnderMouse(smId: string, stateId: string, { x, y }: Point, includeChildrenHeight?: boolean) {
    const drawBounds = this.getDrawBounds(smId, stateId);
    const bounds = !includeChildrenHeight
      ? drawBounds
      : { ...drawBounds, height: drawBounds.height + drawBounds.childrenHeight };
    return isPointInRectangle(bounds, { x, y });
  }

  private getPossibleParentState(
    smId: string,
    position: Point,
    exclude: string[] = []
  ): [string | null, State | null] {
    // назначаем родительское состояние по месту его создания
    let possibleParent: State | null = null;
    let possibleParentId: string | null = null;
    for (const [id, item] of Object.entries(this.model.data.elements.stateMachines[smId].states)) {
      if (exclude.includes(id)) continue;
      if (!this.isUnderMouse(smId, id, position, true)) continue;

      if (possibleParent === null || possibleParentId === null) {
        possibleParent = item;
        possibleParentId = id;
        continue;
      }

      // учитываем вложенность, нужно поместить состояние
      // в максимально дочернее
      if (!this.model.data.elements.stateMachines[smId].states[possibleParentId]) continue;
      const children = this.getEachByParentId(smId, possibleParentId);
      let searchPending = true;
      while (searchPending) {
        searchPending = false;
        // TODO(bryzZz) Нужно проверять по модели а не по вью
        for (const [id, child] of children || []) {
          if (exclude.includes(id)) continue;
          if (!this.isUnderMouse(smId, id, position, true)) continue;

          possibleParent = child;
          searchPending = true;
          break;
        }
      }
    }

    return [possibleParentId, possibleParent];
  }

  compoundStatePosition(
    smId: string,
    id: string,
    type: 'states' | 'finalStates' | 'choiceStates' | 'initialStates'
  ) {
    const state = this.model.data.elements.stateMachines[smId][type][id];
    let { x, y } = state.position;
    if (state.parentId) {
      const parent = this.model.data.elements.stateMachines[smId].states[state.parentId];
      const { x: px, y: py } = this.compoundStatePosition(smId, state.parentId, 'states');

      x += px + CHILDREN_PADDING;
      y += py + parent.dimensions.height + CHILDREN_PADDING;
    }

    return { x, y };
  }

  unlinkState(params: UnlinkStateParams) {
    const { id, smId, canUndo } = params;

    const state = this.model.data.elements.stateMachines[smId].states[id];
    if (!state || !state.parentId) return;

    const parentId = state.parentId;
    let numberOfConnectedActions = 0;

    // Проверка на то что состояние является, тем на которое есть переход из начального
    // TODO(bryzZz) Вынести в функцию
    const stateTransitions = this.getAllByTargetId(smId, id)[0] ?? [];
    const transitionFromInitialState = stateTransitions.find(
      ({ sourceId }) =>
        this.model.data.elements.stateMachines[smId].initialStates[sourceId] !== undefined
    );

    if (transitionFromInitialState) {
      // Перемещаем начальное состояние, на первое найденное в родителе
      const newState = [
        ...Object.entries(this.model.data.elements.stateMachines[smId].states),
      ].find((s) => s[1].parentId === parentId && s[0] !== id);

      if (newState) {
        this.setInitialState(smId, newState[0]);
      } else {
        this.deleteInitialStateWithTransition(smId, transitionFromInitialState.sourceId, canUndo);
      }

      numberOfConnectedActions += 2;
    }

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newPosition = { ...this.compoundStatePosition(smId, id, 'states') }; // ??
    this.changeStatePosition(smId, id, state.position, newPosition, canUndo);
    numberOfConnectedActions += 1;

    this.model.unlinkState(smId, id);

    if (canUndo) {
      this.history.do({
        type: 'unlinkState',
        args: { smId, parentId, params },
        numberOfConnectedActions,
      });
    }
    this.emit('unlinkState', params);

    const [, siblingIds] = this.getSiblings(
      smId,
      id,
      this.model.data.elements.stateMachines[smId].states[parentId].parentId,
      'initialStates'
    );
    if (!siblingIds.length) {
      this.createInitialStateWithTransition(smId, id);
    }
  }

  linkState = (args: LinkStateParams, canUndo = true) => {
    const { parentId, childId, addOnceOff = true, canBeInitial = true } = args;
    const stateMachines = this.getHeadControllerStateMachines();
    for (const smId in stateMachines) {
      // const smId = args.smId ?? this.model.data.currentSm;
      const parent = this.model.data.elements.stateMachines[smId].states[parentId];
      const child = this.model.data.elements.stateMachines[smId].states[childId];
      if (!parent || !child) continue;

      let numberOfConnectedActions = 0;

      // Проверка на то что состояние является, тем на которое есть переход из начального
      // TODO(bryzZz) Вынести в функцию
      const stateTransitions: Transition[] = this.getAllByTargetId(smId, childId)[0] ?? [];
      const transitionFromInitialState = stateTransitions.find(
        ({ sourceId }) =>
          this.model.data.elements.stateMachines[smId].initialStates[sourceId] !== undefined
      );

      if (transitionFromInitialState) {
        this.setInitialState(smId, parentId, canUndo);
        numberOfConnectedActions += 2;
      }

      this.model.linkState(smId, parentId, childId);
      this.changeStatePosition(smId, childId, child.position, { x: 0, y: 0 }, false);

      this.emit('linkState', args);

      // Перелинковка переходов
      //! Нужно делать до создания перехода из начального состояния
      this.emit('linkTransitions', { smId: smId, stateId: childId });
      // Заметка: Если что, можно будет пройтись по канвас контроллерам

      // Если не было начального состояния, им станет новое
      if (
        canBeInitial &&
        this.getSiblings(smId, childId, child.parentId, 'states')[0].length === 0
      ) {
        this.changeStatePosition(
          smId,
          childId,
          child.position,
          { x: INITIAL_STATE_OFFSET, y: INITIAL_STATE_OFFSET },
          false
        );
        this.createInitialStateWithTransition(smId, childId, canUndo);
        numberOfConnectedActions += 2;
      }

      if (canUndo) {
        this.history.do({
          type: 'linkState',
          args: { smId, parentId, childId },
          numberOfConnectedActions,
        });
        if (addOnceOff) {
          this.emit('addDragendStateSig', { smId, stateId: childId });
        }
      }
    }
  };

  createInitialState(params: CCreateInitialStateParams, canUndo = true) {
    const { id: prevId, targetId, smId } = params;
    const target = this.model.data.elements.stateMachines[smId].states[targetId];
    if (!target) return;

    const position = {
      x: target.position.x - INITIAL_STATE_OFFSET,
      y: target.position.y - INITIAL_STATE_OFFSET,
    };

    if (target.parentId) {
      position.x = Math.max(0, position.x);
      position.y = Math.max(0, position.y);
    }

    const id = this.model.createInitialState({
      smId,
      position,
      parentId: target.parentId,
      dimensions: { width: 50, height: 50 },
      id: prevId,
    });

    if (canUndo) {
      this.history.do({
        type: 'createInitialState',
        args: { smId, id },
      });
    }
    this.emit('createInitial', {
      ...params,
      id: id,
      ...this.model.data.elements.stateMachines[smId].initialStates[id],
    });
    return id;
  }

  private createInitialStateWithTransition(smId: string, targetId: string, canUndo = true) {
    const stateId = this.createInitialState({ smId, targetId }, canUndo);
    const target = this.model.data.elements.stateMachines[smId].states[targetId];
    if (!stateId || !target) return;

    this.createTransition(
      {
        smId,
        sourceId: stateId,
        targetId: targetId,
      },
      true,
      canUndo
    );
  }

  changeState(args: ChangeStateParams, canUndo = true) {
    const { smId, id } = args;
    const state = this.model.data.elements.stateMachines[smId].states[id];
    if (!state) return;

    if (canUndo) {
      // TODO: Что делать тут?
      const prevEvents = state.events;
      const prevColor = state.color;
      // const prevActions = structuredClone(prevEvent ?? []);

      this.history.do({
        type: 'changeState',
        args: { args, prevEvents, prevColor },
      });
    }

    this.model.changeState(args);
    this.emit('changeState', args);
  }

  changeStateName = (smId: string, id: string, name: string, canUndo = true) => {
    const state = this.model.data.elements.stateMachines[smId].states[id];
    if (!state) return;

    if (canUndo) {
      this.history.do({
        type: 'changeStateName',
        args: { smId, id, name, prevName: state.name },
      });
    }

    this.model.changeStateName(smId, id, name);
    this.emit('changeStateName', { smId, id, name });
  };

  createState(args: CreateStateParams, canUndo = true) {
    const { smId, parentId, canBeInitial = true } = args;
    let numberOfConnectedActions = 0;
    const newStateId = this.model.createState(args);
    this.emit('createState', { ...args, id: newStateId });

    const siblings = this.getSiblings(smId, newStateId, parentId)[0];
    if (!siblings.length && !parentId) {
      this.createInitialStateWithTransition(smId, newStateId);
    }

    if (parentId) {
      this.linkState({ smId, parentId, childId: newStateId, canBeInitial }, canUndo);
      numberOfConnectedActions += 1;
      // this.emit('linkState', { smId, parentId, childId: newStateId, canBeInitial });
    }

    if (canUndo) {
      this.history.do({
        type: 'createState',
        args: { ...args, newStateId: newStateId },
      });
      numberOfConnectedActions;
    }
  }

  editComponent(args: EditComponentParams, canUndo = true) {
    const { id, parameters, newName, smId } = args;

    const prevComponent = structuredClone(
      this.model.data.elements.stateMachines[smId].components[id]
    );
    this.model.editComponent(smId, id, parameters);

    if (newName) {
      this.renameComponent(smId, id, newName);
    }

    if (canUndo) {
      this.history.do({
        type: 'editComponent',
        args: { args, prevComponent },
      });
    }

    this.emit('editComponent', args);
  }

  changeComponentPosition(
    smId: string,
    name: string,
    startPosition: Point,
    endPosition: Point,
    _canUndo = true
  ) {
    this.model.changeComponentPosition(smId, name, endPosition);
    if (_canUndo) {
      this.history.do({
        type: 'changeComponentPosition',
        args: { smId, name, startPosition, endPosition },
      });
    }
    this.emit('changeComponentPosition', {
      id: name,
      startPosition: startPosition,
      endPosition: endPosition,
    });
  }

  deleteComponent(args: DeleteDrawableParams, canUndo = true) {
    const { id, smId } = args;

    // const prevComponent = this.model.data.elements.stateMachines[smId].components[id];
    this.model.deleteComponent(smId, id);

    if (canUndo) {
      //   this.history.do({
      //     type: 'deleteComponent',
      //     args: { args, prevComponent },
      //   });
    }

    this.emit('deleteComponent', args);
  }

  swapComponents(args: SwapComponentsParams, canUndo = true) {
    this.model.swapComponents(args.smId, args);

    if (canUndo) {
      this.history.do({
        type: 'swapComponents',
        args,
      });
    }

    // Нужно ли вызывать сигнал?
    // this.editor.view.isDirty = true;
    // this.scheme.view.isDirty = true;
  }

  private renameComponent(smId: string, name: string, newName: string) {
    this.model.changeComponentName(smId, name, newName);
    this.emit('renameComponent', { smId: smId, id: name, newName: newName });
  }

  private getEachByStateId(smId: string, stateId: string) {
    return [...Object.entries(this.model.data.elements.stateMachines[smId].transitions)].filter(
      (transition) => transition[1].sourceId === stateId || transition[1].targetId === stateId
    );
  }

  private getEachByParentId(smId: string, parentId: string) {
    return [...Object.entries(this.model.data.elements.stateMachines[smId].states)].filter(
      (state) => state[1].parentId === parentId
    );
  }

  deleteState(args: DeleteDrawableParams, canUndo = true) {
    const { id, smId } = args;
    const state = this.model.data.elements.stateMachines[smId].states[id];
    if (!state) return;
    const parentId = state.parentId;
    let numberOfConnectedActions = 0;

    // Проверка на то что состояние является, тем на которое есть переход из начального
    const stateTransitions: Transition[] = this.getAllByTargetId(smId, id)[0] ?? [];
    const transitionFromInitialState = stateTransitions.find(
      ({ sourceId }) =>
        this.model.data.elements.stateMachines[smId].initialStates[sourceId] !== undefined
    );

    if (transitionFromInitialState) {
      // Перемещаем начальное состояние, на первое найденное в родителе
      const newState = [
        ...Object.entries(this.model.data.elements.stateMachines[smId].states),
      ].find((s) => s[1].parentId === parentId && s[0] !== id);

      if (newState) {
        this.setInitialState(smId, newState[0], canUndo);
      } else {
        this.deleteInitialStateWithTransition(smId, transitionFromInitialState.sourceId, canUndo);
      }

      numberOfConnectedActions += 2;
    }
    // Удаляем зависимые переходы
    const dependetTransitions = this.getEachByStateId(smId, id);
    dependetTransitions.forEach((transition) => {
      this.deleteTransition({ smId, id: transition[0] }, canUndo);
      numberOfConnectedActions += 1;
    });

    const nestedStates = this.getEachByParentId(smId, id);
    // Ищем дочерние состояния и отвязываем их от текущего
    nestedStates.forEach((childState) => {
      // Если есть родительское, перепривязываем к нему
      if (state.parentId) {
        this.linkState({ smId, parentId: state.parentId, childId: childState[0] }, canUndo);
      } else {
        this.unlinkState({ smId, id: childState[0], canUndo });
      }

      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteState',
        args: { smId, id, stateData: { ...structuredClone(state), parentId } },
        numberOfConnectedActions,
      });
    }

    this.model.deleteState(smId, id); // Удаляем модель
    this.emit('deleteState', args);
  }

  getEachObjectByParentId(
    smId: string,
    parentId: string
  ): Omit<
    StateMachine,
    'visual' | 'transitions' | 'components' | 'platform' | 'meta' | 'position' | 'compilerSettings'
  > {
    const sm = this.model.data.elements.stateMachines[smId];
    const objects: Omit<
      StateMachine,
      | 'visual'
      | 'transitions'
      | 'components'
      | 'platform'
      | 'meta'
      | 'position'
      | 'compilerSettings'
    > = {
      states: {},
      initialStates: {},
      finalStates: {},
      choiceStates: {},
      notes: {},
    };

    for (const objectType of StateTypes) {
      for (const objectId in sm[objectType]) {
        const object = sm[objectType][objectId];
        if (object.parentId === parentId) {
          objects[objectType][objectId] = object;
        }
      }
    }

    return objects;
  }

  private getChildrenContainerHeight(smId: string, stateId: string) {
    const children = this.getEachObjectByParentId(smId, stateId);

    if ([...Object.values(children)].length === 0) return 0;

    const bottomChildData = this.getChildren(children);
    if (!bottomChildData || !bottomChildData[0]) return 0;
    let bottomChildId = bottomChildData[0];
    let bottomChildType = bottomChildData[1];
    let bottomChild = children[bottomChildType][bottomChildId];
    let bottomChildContainerHeight = 0;
    let result = 0;
    for (const childType of StateTypes) {
      for (const childId in children[childType]) {
        const child = children[childType][childId];
        const y = child.position.y;
        const height = child.dimensions.height;
        const childrenContainerHeight = this.getChildrenContainerHeight(smId, childId);
        const bY = bottomChild.position.y;
        const bHeight = bottomChild.dimensions.height;
        const bChildrenContainerHeight = this.getChildrenContainerHeight(smId, bottomChildId);
        if (y + height + childrenContainerHeight > bY + bHeight + bChildrenContainerHeight) {
          bottomChild = child;
          bottomChildId = childId;
          bottomChildType = childType;
          bottomChildContainerHeight = childrenContainerHeight;
        }
      }
    }

    result =
      (bottomChild.position.y + bottomChild.dimensions.height + CHILDREN_PADDING * 2) /
        this.model.data.scale +
      bottomChildContainerHeight;

    return result;
  }

  getComputedHeight(object: State | InitialState | FinalState | ChoiceState) {
    return object.dimensions.height / this.model.data.scale;
  }

  getComputedDimensions(smId: string, stateId: string, stateType: StateType) {
    const object = this.model.data.elements.stateMachines[smId][stateType][stateId];
    const width = this.getComputedWidth(smId, stateId, stateType);
    const height = this.getComputedHeight(object);
    const childrenHeight = this.getChildrenContainerHeight(smId, stateId);

    return { width, height, childrenHeight };
  }

  getComputedPosition(
    smId: string,
    stateId: string,
    stateType: 'states' | 'finalStates' | 'initialStates' | 'choiceStates'
  ) {
    const { x, y } = this.compoundStatePosition(smId, stateId, stateType);

    return {
      x: (x + this.model.data.offset.x) / this.model.data.scale,
      y: (y + this.model.data.offset.y) / this.model.data.scale,
    };
  }

  private getChildren(
    objects: Omit<
      StateMachine,
      | 'visual'
      | 'transitions'
      | 'components'
      | 'platform'
      | 'meta'
      | 'position'
      | 'CompilerSettings'
    >
  ): [string, StateType] | undefined {
    for (const stateType of StateTypes) {
      if ([Object.values(objects[stateType])].length !== 0) {
        const id = [...Object.keys(objects[stateType])][0];
        return [id, stateType];
      }
    }

    return;
  }

  getComputedWidth(smId: string, stateId: string, stateType: StateType) {
    const sm = this.model.data.elements.stateMachines[smId];
    const state = sm[stateType][stateId];

    let width = state.dimensions.width / this.model.data.scale;

    const children = this.getEachObjectByParentId(smId, stateId);
    const notEmptyChildrens = Object.values(children).filter(
      (value) => Object.values(value).length !== 0
    );
    if (stateType === 'states' && notEmptyChildrens.length !== 0) {
      const rightChildren = this.getChildren(children);
      if (!rightChildren) throw Error('NO RIGHT CHILDREN');
      let rightChildrenId = rightChildren[0];
      let rightChildrenType = rightChildren[1];
      for (const childrenType in Object.keys(children)) {
        for (const childId in children[childrenType]) {
          const x = this.getComputedPosition(smId, childId, childrenType as StateType).x;
          const width = this.getComputedWidth(smId, childId, childrenType as StateType);
          if (
            x + width >
            this.getComputedPosition(smId, rightChildrenId, rightChildrenType).x +
              this.getComputedWidth(smId, rightChildrenId, rightChildrenType)
          ) {
            rightChildrenId = childId;
            rightChildrenType = childrenType as StateType;
          }
        }
      }

      const x = this.getComputedPosition(smId, stateId, stateType).x;
      const cx = this.getComputedPosition(smId, rightChildrenId, rightChildrenType).x;

      width = Math.max(
        width,
        cx +
          this.getComputedDimensions(smId, rightChildrenId, rightChildrenType).width -
          x +
          CHILDREN_PADDING / this.model.data.scale
      );
    }

    return width;
  }

  private linkFinalState(smId: string, stateId: string, parentId: string) {
    const state = this.model.data.elements.stateMachines[smId].finalStates[stateId];
    const parent = this.model.data.elements.stateMachines[smId].states[parentId];
    if (!state || !parent) return;

    this.model.linkFinalState(smId, stateId, parentId);

    this.emit('linkFinalState', { smId, childId: stateId, parentId });
  }

  deleteFinalState(args: DeleteDrawableParams, canUndo = true) {
    const { smId, id } = args;
    const state = this.model.data.elements.stateMachines[smId].finalStates[id];
    if (!state) return;

    const parentId = state.parentId;
    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    const dependetTransitionsIds = this.getAllByTargetId(smId, id)[1];
    dependetTransitionsIds.forEach((transitionId) => {
      this.deleteTransition({ smId, id: transitionId }, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteFinalState',
        args: { smId, id, stateData: { ...structuredClone(state), parentId } },
        numberOfConnectedActions,
      });
    }
    this.model.deleteFinalState(smId, id); // Удаляем модель

    this.emit('deleteFinal', args);
  }

  private linkChoiceState(smId: string, stateId: string, parentId: string) {
    const sm = this.model.data.elements.stateMachines[smId];
    const state = sm.choiceStates[stateId];
    const parent = sm.choiceStates[parentId];
    if (!state || !parent) return;

    this.model.linkChoiceState(smId, stateId, parentId);
    this.emit('linkChoiceState', { smId, childId: stateId, parentId });
  }

  createChoiceState(params: CreateChoiceStateParams, canUndo = true) {
    const { smId, parentId, position, linkByPoint = true } = params;

    const id = this.model.createChoiceState(params);
    this.emit('createChoice', { ...params, id: id });
    const state = this.model.data.elements.stateMachines[smId].choiceStates[id];

    if (parentId) {
      this.linkChoiceState(smId, id, parentId);
    } else if (linkByPoint) {
      const [computedParentId, parentItem] = this.getPossibleParentState(smId, position);
      if (!computedParentId || !parentItem) return;
      const parentCompoundPosition = this.compoundStatePosition(smId, computedParentId, 'states');
      if (parentItem) {
        const newPosition = {
          x: state.position.x - parentCompoundPosition.x,
          y: state.position.y - parentCompoundPosition.y - parentItem.dimensions.height,
        };
        this.linkChoiceState(smId, id, computedParentId);
        this.changeChoiceStatePosition({ smId, id, endPosition: newPosition });
      }
    }

    if (canUndo) {
      this.history.do({
        type: 'createChoiceState',
        args: { ...params, ...state, newStateId: id },
        numberOfConnectedActions: 0,
      });
    }
  }

  deleteChoiceState(args: DeleteDrawableParams, canUndo = true) {
    const { smId, id } = args;
    const state = this.model.data.elements.stateMachines[smId].choiceStates[id];
    if (!state) return;

    const parentId = state.parentId;
    let numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    const dependetTransitionsIds = this.getAllByTargetId(smId, id)[1];
    dependetTransitionsIds.forEach((transitionId) => {
      this.deleteTransition({ smId, id: transitionId }, canUndo);
      numberOfConnectedActions += 1;
    });

    if (canUndo) {
      this.history.do({
        type: 'deleteChoiceState',
        args: { smId, id, stateData: { ...structuredClone(state), parentId } },
        numberOfConnectedActions,
      });
    }
    this.model.deleteChoiceState(smId, id); // Удаляем модель
    this.emit('deleteChoice', args);
  }

  changeFinalStatePosition(args: ChangePosition, canUndo = true) {
    this.model.changeFinalStatePosition(args.smId, args.id, args.endPosition);
    this.emit('changeFinalStatePosition', args);
    const { startPosition } = args;
    if (canUndo && startPosition !== undefined) {
      this.history.do({
        type: 'changeFinalStatePosition',
        args: { ...args, startPosition: startPosition },
      });
    }
  }

  changeChoiceStatePosition(args: ChangePosition, canUndo = true) {
    this.model.changeChoiceStatePosition(args.smId, args.id, args.endPosition);
    this.emit('changeChoicePosition', args);
    const { startPosition } = args;
    if (canUndo && startPosition !== undefined) {
      this.history.do({
        type: 'changeChoiceStatePosition',
        args: { ...args, startPosition: startPosition },
      });
    }
  }

  createFinalState(params: CreateFinalStateParams, canUndo = true) {
    const { smId, parentId, linkByPoint = true } = params;

    // Проверка на то что в скоупе уже есть конечное состояние
    // Страшно, очень страшно
    const gotParent = parentId
      ? this.model.data.elements.stateMachines[smId].states[parentId]
      : null;
    const computedParent = linkByPoint ? this.getPossibleParentState(smId, params.position) : null;

    const id = this.model.createFinalState(params);
    const state = this.model.data.elements.stateMachines[smId].finalStates[id];
    const siblings = this.getSiblings(smId, id, parentId, 'finalStates')[0];
    if (siblings.length) {
      this.model.deleteFinalState(smId, id);
      return;
    }
    this.emit('createFinal', { ...params, id });

    if (gotParent && parentId) {
      this.linkFinalState(smId, id, parentId);
    } else if (linkByPoint && computedParent) {
      const [parentId, parentItem] = computedParent;
      if (!parentId || !parentId || !parentItem) return;
      const parentCompoundPosition = this.compoundStatePosition(smId, parentId, 'states');
      const newPosition = {
        x: state.position.x - parentCompoundPosition.x,
        y: state.position.y - parentCompoundPosition.y - parentItem.dimensions.height,
      };

      this.linkFinalState(smId, id, parentId);
      this.changeFinalStatePosition({ smId, id, endPosition: newPosition }, false);
    }

    if (canUndo) {
      this.history.do({
        type: 'createFinalState',
        args: { ...params, ...state, newStateId: id },
        numberOfConnectedActions: 0,
      });
    }

    return state;
  }

  deleteSelected = () => {
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      Object.keys(sm.states).forEach((key) => {
        const state = sm.states[key];
        if (state.selection) {
          this.deleteState({ smId, id: key });
        }
      });

      Object.keys(sm.choiceStates).forEach((key) => {
        const state = sm.choiceStates[key];
        if (state.selection) {
          this.deleteChoiceState({ smId, id: key });
        }
      });

      Object.keys(sm.choiceStates).forEach((key) => {
        const state = sm.choiceStates[key];
        if (state.selection) {
          this.deleteChoiceState({ smId: smId, id: key });
        }
      });

      Object.keys(sm.transitions).forEach((key) => {
        const transition = sm.transitions[key];
        if (transition.selection) {
          this.deleteTransition({ smId: smId, id: key });
        }
      });

      Object.keys(sm.notes).forEach((key) => {
        const note = sm.notes[key];
        if (note.selection) {
          this.deleteNote({ smId: smId, id: key });
        }
      });

      Object.keys(sm.components).forEach((key) => {
        const component = sm.components[key];
        if (component.selection) {
          this.deleteComponent({ smId, id: key });
        }
      });
      this.emit('deleteSelected', smId);
    }
  };

  private isChoiceState(value): value is ChoiceState {
    return (
      (value as ChoiceState).position !== undefined &&
      value['text'] === undefined &&
      value['sourceId'] === undefined &&
      value['events'] === undefined
    );
  }

  private isTransition(value): value is Transition {
    return (
      (value as Transition).label !== undefined ||
      (value as Transition).sourceId !== undefined ||
      (value as Transition).targetId !== undefined
    );
  }

  private isNote(value): value is Note {
    return (value as Note).text !== undefined;
  }

  createEvent(args: CreateEventParams) {
    const { stateId, smId, eventData, eventIdx } = args;
    const state = this.model.data.elements.stateMachines[smId].states[stateId];
    if (!state) return;

    this.model.createEvent(smId, stateId, eventData, eventIdx);

    this.emit('createEvent', args);
  }

  createEventAction(args: CreateEventActionParams) {
    const { stateId, value, event, smId } = args;
    const state = this.model.data.elements.stateMachines[smId].states[stateId];
    if (!state) return;

    this.model.createEventAction(smId, stateId, event, value);
    this.emit('createEventAction', args);
  }

  // Редактирование события в состояниях
  changeEvent(args: ChangeEventParams) {
    const { stateId, smId, event, newValue, canUndo = true } = args;
    const state = this.model.data.elements.stateMachines[smId].states[stateId];
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      const prevValue = state.events[eventIdx].do[actionIdx];

      this.model.changeEventAction(smId, stateId, event, newValue);
      this.emit('changeEventAction', { smId, stateId, event, newValue });

      if (canUndo) {
        this.history.do({
          type: 'changeEventAction',
          args: { smId, stateId, event, newValue, prevValue: prevValue as Action },
        });
      }
    } else {
      const prevValue = state.events[eventIdx].trigger;

      this.model.changeEvent(smId, stateId, eventIdx, newValue);
      this.emit('changeEvent', { smId, stateId, event, newValue });
      if (canUndo) {
        this.history.do({
          type: 'changeEvent',
          args: { smId, stateId, event, newValue, prevValue: prevValue as Action },
        });
      }
    }
  }

  // Удаление события в состояниях
  //TODO показывать предупреждение при удалении события в состоянии(модалка)
  deleteEvent(args: DeleteEventParams, canUndo = true) {
    const { stateId, event, smId } = args;
    const state = this.model.data.elements.stateMachines[smId].states[stateId];
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      // Проверяем если действие в событие последнее то надо удалить всё событие
      if (state.events[eventIdx].do.length === 1) {
        return this.deleteEvent({ stateId, smId, event: { eventIdx, actionIdx: null } });
      }

      const prevValue = state.events[eventIdx].do[actionIdx];

      this.model.deleteEventAction(smId, stateId, event);
      this.emit('deleteEventAction', { smId, stateId, event });
      if (canUndo) {
        this.history.do({
          type: 'deleteEventAction',
          args: { smId, stateId, event, prevValue: prevValue as Action },
        });
      }
    } else {
      const prevValue = state.events[eventIdx];

      this.model.deleteEvent(smId, stateId, eventIdx);
      this.emit('deleteEvent', { smId, stateId, event });
      if (canUndo) {
        this.history.do({
          type: 'deleteEvent',
          args: { smId, stateId, eventIdx, prevValue },
        });
      }
    }
  }

  copySelected = () => {
    const stateMachines = this.getHeadControllerStateMachines();
    for (const smId in stateMachines) {
      const [id, nodeToCopy] =
        [...Object.entries(this.model.data.elements.stateMachines[smId].states)].find(
          (value) => value[1].selection
        ) ||
        [...Object.entries(this.model.data.elements.stateMachines[smId].choiceStates)].find(
          (state) => state[1].selection
        ) ||
        [...Object.entries(this.model.data.elements.stateMachines[smId].transitions)].find(
          (transition) => transition[1].selection
        ) ||
        [...Object.entries(this.model.data.elements.stateMachines[smId].notes)].find(
          (note) => note[1].selection
        ) ||
        [];

      if (!nodeToCopy || !id) continue;

      // Тип нужен чтобы отделить ноды при вставке
      let copyType: CopyType = 'state';
      if (this.isChoiceState(nodeToCopy)) copyType = 'choiceState';
      if (this.isTransition(nodeToCopy)) copyType = 'transition';
      if (this.isNote(nodeToCopy)) copyType = 'note';

      // Если скопировалась новая нода, то нужно сбросить смещение позиции вставки
      if (id !== this.copyData?.data.id) {
        this.pastePositionOffset = 0;
      }

      this.copyData = {
        smId: smId,
        type: copyType,
        data: { ...(structuredClone(nodeToCopy) as any), id: id },
      };
      break;
    }
  };

  pasteSelected = () => {
    if (!this.copyData) {
      throw new Error('No copy data!');
    }
    const { type, data, smId } = this.copyData;

    if (type === 'state') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке
      const newId = this.model.createState({
        ...structuredClone(data),
        smId,
        linkByPoint: false,
        id: undefined,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
      this.emit('createState', {
        ...structuredClone(data),
        smId,
        linkByPoint: false,
        id: newId,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
    }

    if (type === 'choiceState') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      const newId = this.model.createChoiceState({
        ...data,
        smId,
        id: undefined,
        linkByPoint: false,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });

      this.emit('createChoice', {
        ...data,
        smId,
        id: newId,
        linkByPoint: false,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });

      return;
    }

    if (type === 'note') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      const newId = this.model.createNote({
        ...data,
        smId,
        id: undefined,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });

      this.emit('createNote', {
        ...data,
        smId,
        id: newId,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });

      return;
    }

    if (type === 'transition') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      const getLabel = () => {
        if (!this.copyData) return;

        if (!data.label) return undefined;

        return {
          ...data.label,
          position: {
            x: data.label.position.x + this.pastePositionOffset,
            y: data.label.position.y + this.pastePositionOffset,
          },
        };
      };

      const newId = this.model.createTransition({
        ...data,
        smId,
        id: undefined,
        label: getLabel(),
      });

      this.emit('createTransition', {
        ...data,
        smId: '',
        id: newId,
        label: getLabel(),
      });
    }

    // TODO: Доделать копирование компонентов
    // if (type === 'component') {
    //   this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

    //   return this.scheme.controller.components.createComponent({
    //     ...data,
    //     name: '', // name должно сгенерится новое, так как это новая сушность
    //     position: {
    //       x: data.position.x + this.pastePositionOffset,
    //       y: data.position.y + this.pastePositionOffset,
    //     },
    //   });
    // }
    return null;
  };

  getCurrentCanvas() {
    return (this.controllers[this.model.data.headControllerId] ?? this.controllers['']).app;
  }

  duplicateSelected = () => {
    this.copySelected();
    this.pasteSelected();
  };

  selectState = (args: { id: string }) => {
    const { id } = args;
    const stateMachines = this.getHeadControllerStateMachines();
    for (const smId in stateMachines) {
      const state = this.model.data.elements.stateMachines[smId].states[id];
      if (!state) continue;

      this.removeSelection();

      this.model.changeStateSelection(smId, id, true);

      this.emit('selectState', { smId, id: id });
      break;
    }
  };

  selectChoiceState(id: string) {
    const stateMachines = this.getHeadControllerStateMachines();

    for (const smId in stateMachines) {
      const state = this.model.data.elements.stateMachines[smId].choiceStates[id];
      if (!state) continue;

      this.removeSelection();

      this.model.changeChoiceStateSelection('', id, true);

      this.emit('selectChoice', { smId: '', id: id });
      break;
    }
  }

  setTextMode(canvasController: CanvasController) {
    if (canvasController.id === '') return;

    const stateMachines = Object.keys(canvasController.stateMachinesSub);
    canvasController.setTextMode();
    for (const stateMachine of stateMachines) {
      this.model.setTextMode(stateMachine);
    }
  }

  selectTransition(id: string) {
    const stateMachines = this.getHeadControllerStateMachines();

    for (const smId in stateMachines) {
      const transition = this.model.data.elements.stateMachines[smId].transitions[id];
      if (!transition) continue;

      this.removeSelection();

      this.model.changeTransitionSelection(smId, id, true);

      this.emit('selectTransition', { smId: smId, id: id });
      break;
    }
  }

  selectNote(id: string) {
    const stateMachines = this.getHeadControllerStateMachines();

    for (const smId in stateMachines) {
      const note = this.model.data.elements.stateMachines[smId].notes[id];
      if (!note) continue;
      this.removeSelection();
      this.model.changeNoteSelection(smId, id, true);
      this.emit('selectNote', { smId: smId, id: id });
      break;
    }
  }

  // TODO: Доделать
  // selectStateMachine(id: string) {
  //   const sm = this.editor.controller.notes.get(id);
  //   if (!note) return;

  //   this.removeSelection();

  //   this.model.changeNoteSelection(id, true);

  //   note.setIsSelected(true);
  // }

  getVacantComponents(): ComponentEntry[] {
    if (!this.platforms) return [];
    const stateMachines = this.getHeadControllerStateMachines();
    for (const smId in stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      const components = sm.components;
      const vacant: ComponentEntry[] = [];
      let platform: PlatformManager | undefined = this.platforms[sm.platform];
      if (!platform) {
        if (isPlatformAvailable(sm.platform)) {
          const platformManager = loadPlatform(sm.platform);
          if (!platformManager) throw new Error('No platform loaded!');
          this.platforms[sm.platform] = platformManager;
          platform = platformManager;
        } else {
          throw new Error('No platform loaded!');
        }
      }
      for (const idx in platform.data.components) {
        const compo = platform.data.components[idx];
        if (compo.singletone && components.hasOwnProperty(idx)) continue;
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

    return [];
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
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];

      Object.keys(sm.choiceStates).forEach((id) => {
        this.model.changeChoiceStateSelection(smId, id, false);
      });

      Object.keys(sm.states).forEach((id) => {
        this.model.changeStateSelection(smId, id, false);
      });

      Object.keys(sm.transitions).forEach((id) => {
        this.model.changeTransitionSelection(smId, id, false);
      });

      Object.keys(sm.notes).forEach((id) => {
        this.model.changeNoteSelection(smId, id, false);
      });

      Object.keys(sm.components).forEach((id) => {
        this.model.changeNoteSelection(smId, id, false);
      });
    }
  }

  createTransitionFromController(args: { source: string; target: string }) {
    const stateMachines = this.getHeadControllerStateMachines();
    for (const smId in stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      const sourceType = sm.states[args.source]
        ? 'states'
        : sm.choiceStates
        ? 'choiceStates'
        : 'finalStates';

      const targetType = sm.states[args.source]
        ? 'states'
        : sm.choiceStates
        ? 'choiceStates'
        : 'finalStates';
      const sourceSm = this.getSmId(args.source, sourceType);
      const targetSm = this.getSmId(args.target, targetType);

      if (sourceSm !== targetSm) throw Error('Машины состояний не сходятся!!');

      this.createTransition({
        smId: sourceSm,
        sourceId: args.source,
        targetId: args.target,
      });
    }
  }
}
