import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { CanvasScheme } from '@renderer/lib/CanvasScheme';
import { PASTE_POSITION_OFFSET_STEP } from '@renderer/lib/constants';
import { History } from '@renderer/lib/data/History';
import { loadPlatform } from '@renderer/lib/data/PlatformLoader';
import { Note, Transition } from '@renderer/lib/drawable';
import {
  CopyData,
  CopyType,
  ChangeComponentParams,
  DeleteComponentParams,
} from '@renderer/lib/types/ControllerTypes';
import { CreateComponentParams, SwapComponentsParams } from '@renderer/lib/types/ModelTypes';
import { Condition, Variable } from '@renderer/types/diagram';

import { ComponentsController } from './ComponentsController';
import { NotesController } from './NotesController';
import { StatesController } from './StatesController';
import { TransitionsController } from './TransitionsController';

import { EditorModel } from '../EditorModel';
import { Initializer } from '../Initializer';
import { ComponentEntry, operatorSet, PlatformManager } from '../PlatformManager';

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

export class ModelController {
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
  initializer!: Initializer;
  platform: PlatformManager | null = null;

  history = new History(this);

  states!: StatesController;
  transitions!: TransitionsController;
  notes!: NotesController;
  components!: ComponentsController;

  private copyData: CopyData | null = null; // То что сейчас скопировано
  private pastePositionOffset = 0; // Для того чтобы при вставке скопированной сущности она не перекрывала предыдущую

  public constructor(private editor: CanvasEditor, private scheme: CanvasScheme) {
    this.initializer = new Initializer(editor, scheme, this);

    this.states = new StatesController(editor);
    this.transitions = new TransitionsController(editor);
    this.notes = new NotesController(editor);

    this.components = new ComponentsController(scheme);
  }

  static getInstance(editor: CanvasEditor, scheme: CanvasScheme): ModelController {
    if (!ModelController.instance) {
      ModelController.instance = new ModelController(editor, scheme);
    }
    return ModelController.instance;
  }

  initPlatform() {
    const platformName = this.model.data.elements.platform;

    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platform = loadPlatform(platformName);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformName);
    }

    this.platform = platform;
    //! Инициализировать компоненты нужно сразу после загрузки платформы
    // Их инициализация не создает отдельными сущности на холсте а перерабатывает данные в удобные структуры
    this.initializer.initComponents();
  }

  loadData() {
    this.initializer.init();

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;
  }

  selectComponent(id: string) {
    const component = this.scheme.controller.components.get(id);
    if (!component) return;

    this.removeSelection();

    this.model.changeComponentSelection(id, true);

    component.setIsSelected(true);
  }

  createComponent(args: CreateComponentParams, canUndo = true) {
    const { name, type } = args;

    if (!this.platform) return;

    this.model.createComponent(args);

    this.platform.nameToVisual.set(name, {
      component: type,
    });

    if (canUndo) {
      this.history.do({
        type: 'createComponent',
        args: { args },
      });
    }

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;
  }

  changeComponent(args: ChangeComponentParams, canUndo = true) {
    const { name, parameters, newName } = args;

    if (!this.platform) return;

    const prevComponent = structuredClone(this.model.data.elements.components[name]);

    this.model.changeComponent(name, parameters);

    const component = this.model.data.elements.components[name];
    this.platform.nameToVisual.set(name, {
      component: component.type,
      label: component.parameters['label'],
      color: component.parameters['labelColor'],
    });

    if (newName) {
      this.renameComponent(name, newName);
    }

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'changeComponent',
        args: { args, prevComponent },
      });
    }
  }

  deleteComponent(args: DeleteComponentParams, canUndo = true) {
    const { name, purge } = args;

    if (!this.platform) return;

    const prevComponent = this.model.data.elements.components[name];
    this.model.deleteComponent(name);

    if (purge) {
      // TODO: «вымарывание» компонента из машины
      console.error('deleteComponent purge not implemented yet');
    }

    this.platform.nameToVisual.delete(name);

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'deleteComponent',
        args: { args, prevComponent },
      });
    }
  }

  swapComponents(args: SwapComponentsParams, canUndo = true) {
    this.model.swapComponents(args);

    if (canUndo) {
      this.history.do({
        type: 'swapComponents',
        args,
      });
    }

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;
  }

  private renameComponent(name: string, newName: string) {
    if (!this.platform) return;

    this.model.changeComponentName(name, newName);

    const visualCompo = this.platform.nameToVisual.get(name);

    if (!visualCompo) return;

    this.platform.nameToVisual.set(newName, visualCompo);
    this.platform.nameToVisual.delete(name);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.editor.controller.states.forEachState((state) => {
      for (const ev of state.eventBox.data) {
        // заменяем в триггере
        if (ev.trigger.component == name) {
          ev.trigger.component = newName;
        }
        for (const act of ev.do) {
          // заменяем в действии
          if (act.component == name) {
            act.component = newName;
          }
        }
      }
    });

    this.editor.controller.transitions.forEach((transition) => {
      if (!transition.data.label) return;

      if (transition.data.label.trigger?.component === name) {
        transition.data.label.trigger.component = newName;
      }

      if (transition.data.label.do) {
        for (const act of transition.data.label.do) {
          if (act.component === name) {
            act.component = newName;
          }
        }
      }

      if (transition.data.label.condition) {
        this.renameCondition(transition.data.label.condition, name, newName);
      }
    });

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;
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
    this.editor.controller.states.forEachState((state) => {
      if (!state.isSelected) return;

      if (state.eventBox.selection) {
        this.editor.controller.states.deleteEvent(state.id, state.eventBox.selection);
        state.eventBox.selection = undefined;
        return;
      }

      this.editor.controller.states.deleteState(state.id);
    });

    this.editor.controller.states.data.choiceStates.forEach((state) => {
      if (!state.isSelected) return;

      this.editor.controller.states.deleteChoiceState(state.id);
    });

    this.editor.controller.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      this.editor.controller.transitions.deleteTransition(transition.id);
    });

    this.editor.controller.notes.forEach((note) => {
      if (!note.isSelected) return;

      this.editor.controller.notes.deleteNote(note.id);
    });

    this.scheme.controller.components.forEach((component) => {
      if (!component.isSelected) return;

      //scheme.controller.components.deleteComponent(component.id);
    });
  };

  copySelected = () => {
    const nodeToCopy =
      [...this.editor.controller.states.data.states.values()].find((state) => state.isSelected) ||
      [...this.editor.controller.transitions.items.values()].find(
        (transition) => transition.isSelected
      ) ||
      [...this.editor.controller.notes.items.values()].find((note) => note.isSelected) ||
      [...this.scheme.controller.components.items.values()].find(
        (component) => component.isSelected
      );

    if (!nodeToCopy) return;

    // Тип нужен чтобы отделить ноды при вствке
    let copyType: CopyType = 'state';
    if (nodeToCopy instanceof Transition) copyType = 'transition';
    if (nodeToCopy instanceof Note) copyType = 'note';

    // Если скопировалась новая нода то нужно сбросить смещение позиции вставки
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

      return this.editor.controller.states.createState({
        ...data,
        id: undefined, // id должно сгенерится новое, так как это новая сушность
        linkByPoint: false,
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
    }

    if (type === 'note') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      return this.editor.controller.notes.createNote({
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

      return this.editor.controller.transitions.createTransition({
        ...data,
        id: undefined,
        label: getLabel(),
      });
    }

    if (type === 'component') {
      this.pastePositionOffset += PASTE_POSITION_OFFSET_STEP; // Добавляем смещение позиции вставки при вставке

      return this.scheme.controller.components.createComponent({
        ...data,
        name: '', // name должно сгенерится новое, так как это новая сушность
        position: {
          x: data.position.x + this.pastePositionOffset,
          y: data.position.y + this.pastePositionOffset,
        },
      });
    }
    return null;
  };

  duplicateSelected = () => {
    this.copySelected();
    this.pasteSelected();
  };

  selectState(id: string) {
    const state = this.editor.controller.states.data.states.get(id);
    if (!state) return;

    this.removeSelection();

    this.model.changeStateSelection(id, true);

    state.setIsSelected(true);
  }

  selectChoiceState(id: string) {
    const state = this.editor.controller.states.data.choiceStates.get(id);
    if (!state) return;

    this.removeSelection();

    this.model.changeChoiceStateSelection(id, true);

    state.setIsSelected(true);
  }

  selectTransition(id: string) {
    const transition = this.editor.controller.transitions.get(id);
    if (!transition) return;

    this.removeSelection();

    this.model.changeTransitionSelection(id, true);

    transition.setIsSelected(true);
  }

  selectNote(id: string) {
    const note = this.editor.controller.notes.get(id);
    if (!note) return;

    this.removeSelection();

    this.model.changeNoteSelection(id, true);

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
    this.editor.controller.states.data.choiceStates.forEach((state) => {
      state.setIsSelected(false);

      this.model.changeChoiceStateSelection(state.id, false);
    });

    this.editor.controller.states.forEachState((state) => {
      state.setIsSelected(false);
      this.model.changeStateSelection(state.id, false);
      state.eventBox.selection = undefined;
    });

    this.editor.controller.transitions.forEach((transition) => {
      transition.setIsSelected(false);
      this.model.changeTransitionSelection(transition.id, false);
    });

    this.editor.controller.notes.forEach((note) => {
      note.setIsSelected(false);
      this.model.changeNoteSelection(note.id, false);
    });

    this.scheme.controller.components.forEach((component) => {
      component.setIsSelected(false);

      this.model.changeComponentSelection(component.id, false);
    });

    this.editor.view.isDirty = true;
    this.scheme.view.isDirty = true;
  }

  getVacantComponents(): ComponentEntry[] {
    if (!this.platform) return [];

    const components = this.model.data.elements.components;
    const vacant: ComponentEntry[] = [];
    for (const idx in this.platform.data.components) {
      const compo = this.platform.data.components[idx];
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
}
