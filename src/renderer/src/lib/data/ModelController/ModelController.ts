import { Point } from 'electron';

import { EventEmitter } from '@renderer/lib/common';
import { PASTE_POSITION_OFFSET_STEP } from '@renderer/lib/constants';
import { History } from '@renderer/lib/data/History';
import {
  CopyData,
  CopyType,
  EditComponentParams,
  SetMountedStatusParams,
} from '@renderer/lib/types/ControllerTypes';
import {
  CreateComponentParams,
  DeleteDrawableParams,
  SwapComponentsParams,
} from '@renderer/lib/types/ModelTypes';
import { Elements, StateMachine, ChoiceState, Transition, Note } from '@renderer/types/diagram';

import { CanvasControllerEvents } from './CanvasController';

import { EditorModel } from '../EditorModel';
import { FilesManager } from '../EditorModel/FilesManager';

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

    this.model.changeComponentSelection(this.getSmId(id, 'components'), id, true);
    this.emit('selectComponent', { id: id });
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

  // selectState(id: string) {
  //   const state = this.editor.controller.states.data.states.get(id);
  //   if (!state) return;

  //   this.removeSelection();

  //   this.model.changeStateSelection(id, true);

  //   state.setIsSelected(true);
  // }

  // selectChoiceState(id: string) {
  //   const state = this.editor.controller.states.data.choiceStates.get(id);
  //   if (!state) return;

  //   this.removeSelection();

  //   this.model.changeChoiceStateSelection(id, true);

  //   state.setIsSelected(true);
  // }

  // selectTransition(id: string) {
  //   const transition = this.editor.controller.transitions.get(id);
  //   if (!transition) return;

  //   this.removeSelection();

  //   this.model.changeTransitionSelection(id, true);

  //   transition.setIsSelected(true);
  // }

  // selectNote(id: string) {
  //   const note = this.editor.controller.notes.get(id);
  //   if (!note) return;

  //   this.removeSelection();

  //   this.model.changeNoteSelection(id, true);

  //   note.setIsSelected(true);
  // }

  // selectStateMachine(id: string) {
  //   const sm = this.editor.controller.notes.get(id);
  //   if (!note) return;

  //   this.removeSelection();

  //   this.model.changeNoteSelection(id, true);

  //   note.setIsSelected(true);
  // }

  // getVacantComponents(): ComponentEntry[] {
  //   if (!this.platform) return [];

  //   const components = this.model.data.elements.components;
  //   const vacant: ComponentEntry[] = [];
  //   for (const idx in this.platform.data.components) {
  //     const compo = this.platform.data.components[idx];
  //     if (compo.singletone && components.hasOwnProperty(idx)) continue;
  //     vacant.push({
  //       idx,
  //       name: compo.name ?? idx,
  //       img: compo.img ?? 'unknown',
  //       description: compo.description ?? '',
  //       singletone: compo.singletone ?? false,
  //     });
  //   }
  //   return vacant;
  // }

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
