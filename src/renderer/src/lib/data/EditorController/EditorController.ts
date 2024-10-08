import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { PASTE_POSITION_OFFSET_STEP } from '@renderer/lib/constants';
import { History } from '@renderer/lib/data/History';
import { loadPlatform } from '@renderer/lib/data/PlatformLoader';
import { ChoiceState, Note, Transition } from '@renderer/lib/drawable';
import {
  CopyData,
  CopyType,
  EditComponentParams,
  RemoveComponentParams,
} from '@renderer/lib/types/EditorController';
import { AddComponentParams, SwapComponentsParams } from '@renderer/lib/types/EditorModel';
import { Condition, Variable } from '@renderer/types/diagram';

import { Initializer } from './Initializer';
import { NotesController } from './NotesController';
import { StatesController } from './StatesController';
import { TransitionsController } from './TransitionsController';

import { ComponentEntry, PlatformManager, operatorSet } from '../PlatformManager';

/**
 * Контроллер машины состояний.
 * Хранит все состояния и переходы, предоставляет интерфейс
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

export class EditorController {
  initializer!: Initializer;

  states!: StatesController;
  transitions!: TransitionsController;
  notes!: NotesController;

  platform: PlatformManager | null = null;

  history = new History(this);

  private copyData: CopyData | null = null; // То что сейчас скопировано
  private pastePositionOffset = 0; // Для того чтобы при вставке скопированной сущьности она не перекрывала предыдущую

  constructor(private app: CanvasEditor) {
    this.initializer = new Initializer(app);

    this.states = new StatesController(app);
    this.transitions = new TransitionsController(app);
    this.notes = new NotesController(app);
  }

  private get view() {
    return this.app.view;
  }

  initPlatform() {
    const platformName = this.app.model.data.elements.platform;

    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platform = loadPlatform(platformName);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformName);
    }

    this.app.controller.platform = platform;

    //! Инициализировать компоненты нужно сразу после загрузки платформы
    // Их инициализация не создает отдельными сущности на холсте а перерабатывает данные в удобные структуры
    this.initializer.initComponents();
  }

  loadData() {
    this.initializer.init();

    this.view.isDirty = true;
  }

  addComponent(args: AddComponentParams, canUndo = true) {
    const { name, type } = args;

    if (!this.platform) return;

    this.app.model.addComponent(args);

    this.platform.nameToVisual.set(name, {
      component: type,
    });

    if (canUndo) {
      this.history.do({
        type: 'addComponent',
        args: { args },
      });
    }

    this.view.isDirty = true;
  }

  editComponent(args: EditComponentParams, canUndo = true) {
    const { name, parameters, newName } = args;

    if (!this.platform) return;

    const prevComponent = structuredClone(this.app.model.data.elements.components[name]);

    this.app.model.editComponent(name, parameters);

    const component = this.app.model.data.elements.components[name];
    this.platform.nameToVisual.set(name, {
      component: component.type,
      label: component.parameters['label'],
      color: component.parameters['labelColor'],
    });

    if (newName) {
      this.renameComponent(name, newName);
    }

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'editComponent',
        args: { args, prevComponent },
      });
    }
  }

  removeComponent(args: RemoveComponentParams, canUndo = true) {
    const { name, purge } = args;

    if (!this.platform) return;

    const prevComponent = this.app.model.data.elements.components[name];
    this.app.model.removeComponent(name);

    if (purge) {
      // TODO: «вымарывание» компонента из машины
      console.error('removeComponent purge not implemented yet');
    }

    this.platform.nameToVisual.delete(name);

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'removeComponent',
        args: { args, prevComponent },
      });
    }
  }

  swapComponents(args: SwapComponentsParams, canUndo = true) {
    this.app.model.swapComponents(args);

    if (canUndo) {
      this.history.do({
        type: 'swapComponents',
        args,
      });
    }

    this.view.isDirty = true;
  }

  /**
   * * Не работает на текстовые данные
   */
  private renameComponent(name: string, newName: string) {
    if (!this.platform) return;

    this.app.model.renameComponent(name, newName);

    const visualCompo = this.platform.nameToVisual.get(name);

    if (!visualCompo) return;

    this.platform.nameToVisual.set(newName, visualCompo);
    this.platform.nameToVisual.delete(name);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.states.forEachState((state) => {
      for (const ev of state.eventBox.data) {
        // заменяем в триггере
        if (typeof ev.trigger !== 'string' && ev.trigger.component == name) {
          ev.trigger.component = newName;
        }
        for (const act of ev.do) {
          // заменяем в действии
          if (typeof act !== 'string' && act.component == name) {
            act.component = newName;
          }
        }
      }
    });

    this.transitions.forEach((transition) => {
      if (!transition.data.label) return;

      if (
        typeof transition.data.label.trigger !== 'string' &&
        transition.data.label.trigger?.component === name
      ) {
        transition.data.label.trigger.component = newName;
      }

      if (transition.data.label.do) {
        for (const act of transition.data.label.do) {
          if (typeof act !== 'string' && act.component === name) {
            act.component = newName;
          }
        }
      }

      if (transition.data.label.condition && typeof transition.data.label.condition !== 'string') {
        this.renameCondition(transition.data.label.condition, name, newName);
      }
    });

    this.view.isDirty = true;
  }

  renameCondition(ac: Condition, oldName: string, newName: string) {
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

  deleteSelected = () => {
    this.states.forEachState((state) => {
      if (!state.isSelected) return;

      if (state.eventBox.selection) {
        this.states.deleteEvent(state.id, state.eventBox.selection);
        state.eventBox.selection = undefined;
        return;
      }

      this.states.deleteState(state.id);
    });

    this.states.data.choiceStates.forEach((state) => {
      if (!state.isSelected) return;

      this.states.deleteChoiceState(state.id);
    });

    this.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      this.transitions.deleteTransition(transition.id);
    });

    this.notes.forEach((note) => {
      if (!note.isSelected) return;

      this.notes.deleteNote(note.id);
    });
  };

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

  pasteSelected = () => {
    if (!this.copyData) return;

    const { type, data } = this.copyData;

    if (type === 'state') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      return this.states.createState({
        ...structuredClone(data),
        id: undefined, // id должно сгенерится новое, так как это новая сущность
        linkByPoint: false,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
    }

    if (type === 'choiceState') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      return this.states.createChoiceState({
        ...data,
        id: undefined,
        linkByPoint: false,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
    }

    if (type === 'note') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      return this.notes.createNote({
        ...data,
        id: undefined,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
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

      return this.transitions.createTransition({
        ...data,
        id: undefined,
        label: getLabel(),
      });
    }

    return null;
  };

  duplicateSelected = () => {
    this.copySelected();
    this.pasteSelected();
  };

  selectState(id: string) {
    const state = this.states.data.states.get(id);
    if (!state) return;

    this.removeSelection();

    this.app.model.changeStateSelection(id, true);

    state.setIsSelected(true);
  }

  selectChoiceState(id: string) {
    const state = this.states.data.choiceStates.get(id);
    if (!state) return;

    this.removeSelection();

    this.app.model.changeChoiceStateSelection(id, true);

    state.setIsSelected(true);
  }

  selectTransition(id: string) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    this.removeSelection();

    this.app.model.changeTransitionSelection(id, true);

    transition.setIsSelected(true);
  }

  selectNote(id: string) {
    const note = this.notes.get(id);
    if (!note) return;

    this.removeSelection();

    this.app.model.changeNoteSelection(id, true);

    note.setIsSelected(true);
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
    this.states.data.choiceStates.forEach((state) => {
      state.setIsSelected(false);

      this.app.model.changeChoiceStateSelection(state.id, false);
    });

    this.states.forEachState((state) => {
      state.setIsSelected(false);
      this.app.model.changeStateSelection(state.id, false);
      state.eventBox.selection = undefined;
    });

    this.transitions.forEach((transition) => {
      transition.setIsSelected(false);
      this.app.model.changeTransitionSelection(transition.id, false);
    });

    this.notes.forEach((note) => {
      note.setIsSelected(false);
      this.app.model.changeNoteSelection(note.id, false);
    });

    this.view.isDirty = true;
  }

  getVacantComponents(): ComponentEntry[] {
    if (!this.platform) return [];

    const components = this.app.model.data.elements.components;
    const vacant: ComponentEntry[] = [];
    for (const idx in this.platform.data.components) {
      const compo = this.platform.data.components[idx];
      if (
        (compo.singletone || this.platform.data.staticComponents) &&
        components.hasOwnProperty(idx)
      )
        continue;
      vacant.push({
        idx,
        name: compo.name ?? idx,
        img: compo.img || 'stubComponent',
        description: compo.description ?? '',
        singletone: compo.singletone || this.platform.data.staticComponents,
      });
    }
    return vacant;
  }

  setTextMode() {
    this.app.model.setTextMode();

    this.states.updateAll();
    this.transitions.updateAll();

    this.view.isDirty = true;
  }
}
