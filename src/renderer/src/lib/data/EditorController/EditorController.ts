import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { History } from '@renderer/lib/data/History';
import { State } from '@renderer/lib/drawable';
import { EditComponentParams, RemoveComponentParams } from '@renderer/lib/types/EditorController';
import { AddComponentParams } from '@renderer/lib/types/EditorModel';
import {
  Condition,
  Variable,
  State as StateData,
  Transition as TransitionData,
  Note as NoteData,
} from '@renderer/types/diagram';

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

  platform!: PlatformManager;

  history = new History(this);

  constructor(private app: CanvasEditor) {
    this.initializer = new Initializer(app);

    this.states = new StatesController(app);
    this.transitions = new TransitionsController(app);
    this.notes = new NotesController(app);
  }

  private get view() {
    return this.app.view;
  }

  loadData() {
    this.initializer.init();

    this.view.isDirty = true;
  }

  addComponent(args: AddComponentParams, canUndo = true) {
    const { name, type } = args;

    this.app.model.addComponent(args);

    this.platform.nameToVisual.set(name, {
      component: type,
    });

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'addComponent',
        args: { args },
      });
    }
  }

  editComponent(args: EditComponentParams, canUndo = true) {
    const { name, parameters, newName } = args;

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

  private renameComponent(name: string, newName: string) {
    this.app.model.renameComponent(name, newName);

    const visualCompo = this.platform.nameToVisual.get(name);

    if (!visualCompo) return;

    this.platform.nameToVisual.set(newName, visualCompo);
    this.platform.nameToVisual.delete(name);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.states.forEachState((state) => {
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

    this.transitions.forEach((transition) => {
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
    this.states.forEachState((state) => {
      if (!state.isSelected) return;

      const data = this.app.model.serializer.getState(state.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });

    this.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      const data = this.app.model.serializer.getTransition(transition.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });

    this.notes.forEach((note) => {
      if (!note.isSelected) return;

      const data = this.app.model.serializer.getNote(note.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });
  };

  pasteSelected = async () => {
    const data = await navigator.clipboard.readText();

    const copyData = JSON.parse(data) as StateData | TransitionData | NoteData;

    if ('name' in copyData) {
      return this.states.createState({
        name: copyData.name,
        position: copyData.position,
        events: copyData.events,
        parentId: copyData.parentId,
        color: copyData.color,
      });
    }

    if ('text' in copyData) {
      return this.notes.createNote(copyData);
    }

    return this.transitions.createTransition({
      ...copyData,
    });
  };

  selectState(id: string) {
    const state = this.states.get(id);
    if (!state || !(state instanceof State)) return;

    this.removeSelection();

    this.app.model.changeStateSelection(id, true);

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
    const components = this.app.model.data.elements.components;
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
