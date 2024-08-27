import { Point } from 'electron';

import { EventEmitter } from '@renderer/lib/common';
import { INITIAL_STATE_OFFSET, PASTE_POSITION_OFFSET_STEP } from '@renderer/lib/constants';
import { History } from '@renderer/lib/data/History';
import {
  CopyData,
  CopyType,
  EditComponentParams,
  LinkStateParams,
  SetMountedStatusParams,
  StatesControllerDataStateType,
} from '@renderer/lib/types/ControllerTypes';
import {
  CreateComponentParams,
  CreateNoteParams,
  CreateStateParams,
  CreateTransitionParams,
  DeleteDrawableParams,
  SwapComponentsParams,
} from '@renderer/lib/types/ModelTypes';
import {
  Elements,
  StateMachine,
  ChoiceState,
  Transition,
  Note,
  InitialState,
  State,
} from '@renderer/types/diagram';

import { CanvasControllerEvents } from './CanvasController';

import { EditorModel } from '../EditorModel';
import { FilesManager } from '../EditorModel/FilesManager';
import { loadPlatform } from '../PlatformLoader';
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

type ModelControllerEvents = Record<string, never> & CanvasControllerEvents;

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
    }
  );
  files = new FilesManager(this);
  history = new History(this);
  vacantComponents: { [id: string]: ComponentEntry[] } = {};
  platforms: { [id: string]: PlatformManager } = {};
  private copyData: CopyData | null = null; // То что сейчас скопировано
  private pastePositionOffset = 0; // Для того чтобы при вставке скопированной сущности она не перекрывала предыдущую

  constructor() {
    super();
    this.watch();
  }

  private watch() {
    this.on('isMounted', this.setMountStatus);
  }

  private setMountStatus(args: SetMountedStatusParams) {
    const canvas = this.model.data.canvas[args.canvasId];
    if (!canvas) {
      return;
    }
    canvas.isMounted = args.status;
  }

  initPlatform() {
    //TODO: исправить то, что платформы загружаются и в ModelController, и в CanvasController
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      const platform = loadPlatform(sm.platform);
      if (platform) {
        this.platforms[platform.name] = platform;
      }
    }
    this.emit('initPlatform', null);
  }

  initData(basename: string | null, filename: string, elements: Elements) {
    this.model.init(basename, filename, elements);
    this.model.makeStale();
  }

  loadData() {
    this.emit('loadData', null);
  }

  private getSmId(id: string, element: `${keyof StateMachine}`) {
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      if (!sm[element]) {
        throw new Error('Never is reached');
      }
      if (sm[element][id]) {
        return smId;
      }
    }
    throw new Error('Never is reached');
  }

  selectComponent(id: string) {
    this.removeSelection();

    // TODO: Откуда брать id машины состояний?
    this.model.changeComponentSelection(this.getSmId(id, 'components'), id, true);
    this.emit('selectComponent', { id: id, smId: '' });
  }

  createComponent(args: CreateComponentParams, canUndo = true) {
    this.model.createComponent(args);

    this.emit('createComponent', args);
    if (canUndo) {
      this.history.do({
        type: 'createComponent',
        args: { args },
      });
    }
  }

  createNote(args: CreateNoteParams, canUndo = true) {
    const newId = this.model.createNote(args);

    this.emit('createNote', { ...args, id: newId });
    if (canUndo) {
      this.history.do({
        type: 'createNote',
        args: { id: newId, params: args },
      });
    }
  }

  createTransition(args: CreateTransitionParams, canUndo = true) {
    const newId = this.model.createTransition(args);

    this.emit('createTransition', { ...args, id: newId });
    if (canUndo) {
      this.history.do({
        type: 'createTransition',
        args: { id: newId, params: args },
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

    const siblingsIds = this.getSiblings(stateId, state.parentId, 'states')[1];
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

    this.emit('changeTransition', {
      smId: smId,
      id: id,
      ...transitionFromInitialState,
      targetId: stateId,
    });

    if (canUndo) {
      this.history.do({
        type: 'changeTransition',
        args: {
          args: { smId, id, ...transitionFromInitialState },
          prevData: structuredClone({ ...transitionFromInitialState }),
        },
      });
    }

    this.model.changeTransition({
      smId: smId,
      id: id,
      ...transitionFromInitialState,
      targetId: stateId,
    });

    this.changeInitialStatePosition(smId, id, initialState.position, position, canUndo);
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
        args: { id, startPosition, endPosition },
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
        args: { id, startPosition, endPosition },
      });
    }

    this.model.changeStatePosition(smId, id, endPosition);
    this.emit('changeStatePosition', { smId, id, startPosition, endPosition });
  }

  linkState(args: LinkStateParams, canUndo = true) {
    const { smId, parentId, childId, addOnceOff = false, canBeInitial = true } = args;

    const parent = this.model.data.elements.stateMachines[smId].states[parentId];
    const child = this.model.data.elements.stateMachines[smId].states[childId];

    if (!parent || !child) return;

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

    // (child.parent || this.view).children.remove(child, Layer.States);
    // child.parent = parent;
    // parent.children.add(child, Layer.States);

    // Перелинковка переходов
    //! Нужно делать до создания перехода из начального состояния
    this.controller.transitions.forEachByStateId(childId, (transition) => {
      this.controller.transitions.linkTransition(transition.id);
    });

    // Если не было начального состояния, им станет новое
    if (
      canBeInitial &&
      this.getSiblings(smId, child.id, child.data.parentId, 'states')[0].length === 0
    ) {
      this.changeStatePosition(
        childId,
        child.position,
        { x: INITIAL_STATE_OFFSET, y: INITIAL_STATE_OFFSET },
        false
      );
      this.createInitialStateWithTransition(child.id, canUndo);
      numberOfConnectedActions += 2;
    }

    if (canUndo) {
      this.history.do({
        type: 'linkState',
        args: { parentId, childId },
        numberOfConnectedActions,
      });
      if (addOnceOff) {
        child.addOnceOff('dragend'); // Линковка состояния меняет его позицию и это плохо для undo
      }
    }

    this.view.isDirty = true;
  }

  createState(args: CreateStateParams, canUndo = true) {
    const { smId, id, parentId, position, linkByPoint = true, canBeInitial = true } = args;
    let numberOfConnectedActions = 0;
    const newStateId = this.model.createState(args);

    if (parentId) {
      this.linkState({ smId, parentId, childId: newStateId, canBeInitial }, canUndo);
      numberOfConnectedActions += 1;
    }
    // Еще много чего...
    this.emit('createState', { ...args, id: newStateId });
    if (canUndo) {
      this.history.do({
        type: 'createState',
        args: { ...args, newStateId: newStateId },
      });
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
    this.emit('changeComponentPosition', {
      id: name,
      startPosition: startPosition,
      endPosition: endPosition,
    });
    this.model.changeComponentPosition(smId, name, endPosition);
    if (_canUndo) {
      this.history.do({
        type: 'changeComponentPosition',
        args: { name, startPosition, endPosition },
      });
    }
  }

  deleteComponent(args: DeleteDrawableParams, canUndo = true) {
    const { id, smId } = args;

    const prevComponent = this.model.data.elements.stateMachines[smId].components[id];
    this.model.deleteComponent(smId, id);

    if (canUndo) {
      this.history.do({
        type: 'deleteComponent',
        args: { args, prevComponent },
      });
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

  deleteSelected = () => {
    for (const smId in this.model.data.elements.stateMachines) {
      const sm = this.model.data.elements.stateMachines[smId];
      Object.keys(sm.states).forEach((key) => {
        const state = sm.states[key];
        if (state.selection) {
          this.model.deleteState(smId, key);
        }
      });

      Object.keys(sm.choiceStates).forEach((key) => {
        const state = sm.choiceStates[key];
        if (state.selection) {
          this.model.deleteChoiceState(smId, key);
        }
      });

      Object.keys(sm.choiceStates).forEach((key) => {
        const state = sm.choiceStates[key];
        if (state.selection) {
          this.model.deleteChoiceState(smId, key);
        }
      });

      Object.keys(sm.transitions).forEach((key) => {
        const transition = sm.transitions[key];
        if (transition.selection) {
          this.model.deleteTransition(smId, key);
        }
      });

      Object.keys(sm.notes).forEach((key) => {
        const note = sm.notes[key];
        if (note.selection) {
          this.model.deleteNote(smId, key);
        }
      });

      Object.keys(sm.components).forEach((key) => {
        const component = sm.components[key];
        if (component.selection) {
          this.model.deleteComponent(smId, key);
        }
      });
      this.emit('deleteSelected', smId);
    }
  };

  private isChoiceState(value): value is ChoiceState {
    return (
      (value as ChoiceState).position !== undefined &&
      value['text'] === undefined &&
      value['sourceId'] === undefined
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

  copySelected = () => {
    // TODO: Откуда брать id машины состояний? Копирование компонентов
    const [id, nodeToCopy] =
      [...Object.entries(this.model.data.elements.stateMachines[''].states)].find(
        (value) => value[1].selection
      ) ||
      [...Object.entries(this.model.data.elements.stateMachines[''].choiceStates)].find(
        (state) => state[1].selection
      ) ||
      [...Object.entries(this.model.data.elements.stateMachines[''].transitions)].find(
        (transition) => transition[1].selection
      ) ||
      [...Object.entries(this.model.data.elements.stateMachines[''].notes)].find(
        (note) => note[1].selection
      ) ||
      [];

    if (!nodeToCopy || !id) return;

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
      type: copyType,
      data: { ...(structuredClone(nodeToCopy) as any), id: id },
    };
  };

  pasteSelected = () => {
    if (!this.copyData) {
      throw new Error('aaa');
    }
    const { type, data } = this.copyData;

    // TODO: откуда брать id машины состояний?

    if (type === 'state') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке
      const newId = this.model.createState({
        smId: '',
        ...structuredClone(data),
        linkByPoint: false,
        id: undefined,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
      this.emit('createState', {
        smId: '',
        ...structuredClone(data),
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
        smId: '',
        id: undefined,
        linkByPoint: false,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });

      this.emit('createChoice', {
        ...data,
        smId: '',
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
        smId: '',
        id: undefined,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });

      this.emit('createNote', {
        ...data,
        smId: '',
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
        smId: '',
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

  duplicateSelected = () => {
    this.copySelected();
    this.pasteSelected();
  };

  selectState(id: string) {
    // TODO: Откуда брать id машины состояний?
    const state = this.model.data.elements.stateMachines[''].states[id];
    if (!state) return;

    this.removeSelection();

    this.model.changeStateSelection('', id, true);

    this.emit('selectState', { smId: '', id: id });
  }

  selectChoiceState(id: string) {
    // TODO: Откуда брать id машины состояний?
    const state = this.model.data.elements.stateMachines[''].choiceStates[id];
    if (!state) return;

    this.removeSelection();

    this.model.changeChoiceStateSelection('', id, true);

    this.emit('selectChoice', { smId: '', id: id });
  }

  selectTransition(id: string) {
    // TODO: Откуда брать id машины состояний?
    const transition = this.model.data.elements.stateMachines[''].transitions[id];
    if (!transition) return;

    this.removeSelection();

    this.model.changeTransitionSelection('', id, true);

    this.emit('selectTransition', { smId: '', id: id });
  }

  selectNote(id: string) {
    const note = this.model.data.elements.stateMachines[''].notes[id];
    if (!note) return;

    this.removeSelection();

    this.model.changeNoteSelection('', id, true);

    this.emit('selectNote', { smId: '', id: id });
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

    const sm = this.model.data.elements.stateMachines[''];
    const components = sm.components;
    const vacant: ComponentEntry[] = [];
    const platform = this.platforms[sm.platform];
    if (!platform) {
      throw new Error('aaaaaaa');
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
}
