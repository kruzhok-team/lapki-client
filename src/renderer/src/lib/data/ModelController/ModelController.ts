import { Point } from 'electron';

import { EventEmitter } from '@renderer/lib/common';
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
import { Elements } from '@renderer/types/diagram';

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

  constructor() {
    super();
    this.watch();
  }

  private copyData: CopyData | null = null; // То что сейчас скопировано
  private pastePositionOffset = 0; // Для того чтобы при вставке скопированной сущности она не перекрывала предыдущую

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

  selectComponent(id: string) {
    this.removeSelection();

    this.model.changeComponentSelection(id, true);
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
    this.model.editComponent(id, parameters);

    if (newName) {
      this.renameComponent(id, newName);
    }

    if (canUndo) {
      this.history.do({
        type: 'editComponent',
        args: { args, prevComponent },
      });
    }

    this.emit('editComponent', args);
  }

  changeComponentPosition(name: string, startPosition: Point, endPosition: Point, _canUndo = true) {
    // this.components.changeComponentPosition(name, startPosition, endPosition, _canUndo);
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
    this.model.deleteComponent(id);

    if (canUndo) {
      this.history.do({
        type: 'deleteComponent',
        args: { args, prevComponent },
      });
    }

    this.emit('deleteComponent', args);
  }

  swapComponents(args: SwapComponentsParams, canUndo = true) {
    this.model.swapComponents(args);

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

  private renameComponent(name: string, newName: string) {
    this.model.changeComponentName(name, newName);
    this.emit('renameComponent', { id: name, newName: newName });
  }

  // deleteSelected = () => {
  //   this.editor.controller.states.forEachState((state) => {
  //     if (!state.isSelected) return;

  //     if (state.eventBox.selection) {
  //       this.editor.controller.states.deleteEvent(state.id, state.eventBox.selection);
  //       state.eventBox.selection = undefined;
  //       return;
  //     }

  //     this.editor.controller.states.deleteState(state.id);
  //   });

  //   this.editor.controller.states.data.choiceStates.forEach((state) => {
  //     if (!state.isSelected) return;

  //     this.editor.controller.states.deleteChoiceState(state.id);
  //   });

  //   this.editor.controller.transitions.forEach((transition) => {
  //     if (!transition.isSelected) return;

  //     this.editor.controller.transitions.deleteTransition(transition.id);
  //   });

  //   this.editor.controller.notes.forEach((note) => {
  //     if (!note.isSelected) return;

  //     this.editor.controller.notes.deleteNote(note.id);
  //   });

  //   this.scheme.controller.components.forEach((component) => {
  //     if (!component.isSelected) return;

  //     //scheme.controller.components.deleteComponent(component.id);
  //   });
  // };

  // copySelected = () => {
  //   const nodeToCopy =
  //     [...this.states.data.states.values()].find((state) => state.isSelected) ||
  //     [...this.states.data.choiceStates.values()].find((state) => state.isSelected) ||
  //     [...this.transitions.items.values()].find((transition) => transition.isSelected) ||
  //     [...this.notes.items.values()].find((note) => note.isSelected);

  //   if (!nodeToCopy) return;

  //   // Тип нужен чтобы отделить ноды при вставке
  //   let copyType: CopyType = 'state';
  //   if (nodeToCopy instanceof ChoiceState) copyType = 'choiceState';
  //   if (nodeToCopy instanceof Transition) copyType = 'transition';
  //   if (nodeToCopy instanceof Note) copyType = 'note';

  //   // Если скопировалась новая нода, то нужно сбросить смещение позиции вставки
  //   if (nodeToCopy.id !== this.copyData?.data.id) {
  //     this.pastePositionOffset = 0;
  //   }

  //   this.copyData = {
  //     type: copyType,
  //     data: { ...(structuredClone(nodeToCopy.data) as any), id: nodeToCopy.id },
  //   };
  // };

  // pasteSelected = () => {
  //   if (!this.copyData) return;

  //   const { type, data } = this.copyData;

  //   if (type === 'state') {
  //     this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

  //     return this.states.createState({
  //       ...structuredClone(data),
  //       id: undefined, // id должно сгенерится новое, так как это новая сущность
  //       linkByPoint: false,
  //       position: {
  //         x: data.position.x + this.pastePositionOffset,
  //         y: data.position.y + this.pastePositionOffset,
  //       },
  //     });
  //   }

  //   if (type === 'choiceState') {
  //     this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

  //     return this.states.createChoiceState({
  //       ...data,
  //       id: undefined,
  //       linkByPoint: false,
  //       position: {
  //         x: data.position.x + this.pastePositionOffset,
  //         y: data.position.y + this.pastePositionOffset,
  //       },
  //     });
  //   }

  //   if (type === 'note') {
  //     this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

  //     return this.editor.controller.notes.createNote({
  //       ...data,
  //       id: undefined,
  //       position: {
  //         x: data.position.x + this.pastePositionOffset,
  //         y: data.position.y + this.pastePositionOffset,
  //       },
  //     });
  //   }

  //   if (type === 'transition') {
  //     this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

  //     const getLabel = () => {
  //       if (!this.copyData) return;

  //       if (!data.label) return undefined;

  //       return {
  //         ...data.label,
  //         position: {
  //           x: data.label.position.x + this.pastePositionOffset,
  //           y: data.label.position.y + this.pastePositionOffset,
  //         },
  //       };
  //     };

  //     return this.editor.controller.transitions.createTransition({
  //       ...data,
  //       id: undefined,
  //       label: getLabel(),
  //     });
  //   }

  //   if (type === 'component') {
  //     this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

  //     return this.scheme.controller.components.createComponent({
  //       ...data,
  //       name: '', // name должно сгенерится новое, так как это новая сушность
  //       position: {
  //         x: data.position.x + this.pastePositionOffset,
  //         y: data.position.y + this.pastePositionOffset,
  //       },
  //     });
  //   }
  //   return null;
  // };

  // duplicateSelected = () => {
  //   this.copySelected();
  //   this.pasteSelected();
  // };

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
        this.model.changeChoiceStateSelection(id, false);
      });

      Object.keys(sm.states).forEach((id) => {
        this.model.changeStateSelection(id, false);
      });

      Object.keys(sm.transitions).forEach((id) => {
        this.model.changeTransitionSelection(id, false);
      });

      Object.keys(sm.notes).forEach((id) => {
        this.model.changeNoteSelection(id, false);
      });

      Object.keys(sm.components).forEach((id) => {
        this.model.changeNoteSelection(id, false);
      });
    }
  }
}
