import { EditorView } from '@renderer/lib/basic';
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

  constructor(private view: EditorView, private history: History) {
    this.initializer = new Initializer(this.view, this);

    this.states = new StatesController(this.view, this.history);
    this.transitions = new TransitionsController(this.view, this.history);
    this.notes = new NotesController(this.view, this.history);
  }

  loadData() {
    this.initializer.init();

    this.view.isDirty = true;
  }

  // TODO
  /**
   * Обёртка для удобного создания {@link InitialState|маркера начального состояния}
   * или перестановки его на другое {@link State|состояние}
   */
  // setInitialState = (stateId: string, canUndo = true) => {
  //   const initialState = this.view.app.model.data.elements.initialState;

  //   if (!initialState) {
  //     return this.createInitialState(stateId, undefined, canUndo);
  //   }

  //   if (initialState.target === stateId) return;

  //   return this.changeInitialState(initialState.target, stateId, canUndo);
  // };

  // /**
  //  * Вызывается при удлении {@link State|состояния} чтобы
  //  * {@link InitialState|маркер начального состояния} перепрыгнул на другое состояние
  //  * или удалился если состояний нет
  //  */
  // removeInitialState = (stateId: string, canUndo = true) => {
  //   for (const id of this.states.keys()) {
  //     if (id === stateId) continue;

  //     return this.changeInitialState(stateId, id, canUndo);
  //   }

  //   this.deleteInitialState(canUndo);
  // };

  // createInitialState = (targetId: string, initialPosition?: Point, canUndo = true) => {
  //   const target = this.states.get(targetId);
  //   if (!target) return;

  //   const data = {
  //     target: targetId,
  //     position: initialPosition ?? {
  //       x: target.compoundPosition.x - 100,
  //       y: target.compoundPosition.y - 100,
  //     },
  //   };

  //   this.view.app.model.changeInitialState(data);
  //   this.view.statesController.initInitialStateMark();

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'createInitialState',
  //       args: data,
  //     });
  //   }

  //   this.view.isDirty = true;
  // };

  // /**
  //  * Перемещение {@link InitialState|маркера начального состояния}
  //  * с одного {@link State|состояния} на другое
  //  */
  // changeInitialState = (prevTargetId: string, newTargetId: string, canUndo = true) => {
  //   const target = this.states.get(newTargetId);
  //   if (!target) return;

  //   const position = {
  //     x: target.compoundPosition.x - 100,
  //     y: target.compoundPosition.y - 100,
  //   };
  //   this.view.app.model.changeInitialState({
  //     target: newTargetId,
  //     position,
  //   });
  //   this.view.statesController.initInitialStateMark();

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'changeInitialState',
  //       args: { prevTargetId, newTargetId },
  //     });
  //   }

  //   this.view.isDirty = true;
  // };

  // /**
  //  * Изменение позиции {@link InitialState|маркера начального состояния}
  //  */
  // changeInitialStatePosition = (startPosition: Point, endPosition: Point, canUndo = true) => {
  //   const initialState = this.view.app.model.data.elements.initialState;
  //   if (!initialState) return;

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'changeInitialStatePosition',
  //       args: { startPosition, endPosition },
  //     });
  //   }

  //   this.view.app.model.changeInitialStatePosition(endPosition);

  //   this.view.isDirty = true;
  // };

  // getInitialStatePosition = () => {
  //   const initialState = this.view.app.model.data.elements.initialState;
  //   if (!initialState) return null;
  //   return initialState.position;
  // };

  // deleteInitialState = (canUndo = true) => {
  //   const initialStateData = this.view.app.model.data.elements.initialState;

  //   if (!initialStateData) return;

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'deleteInitialState',
  //       args: initialStateData,
  //     });
  //   }

  //   this.view.statesController.clearInitialStateMark();
  //   this.view.app.model.deleteInitialState();

  //   this.view.isDirty = true;
  // };

  addComponent(args: AddComponentParams, canUndo = true) {
    const { name, type } = args;

    this.view.app.model.addComponent(args);

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

    const prevComponent = structuredClone(this.view.app.model.data.elements.components[name]);

    this.view.app.model.editComponent(name, parameters);

    const component = this.view.app.model.data.elements.components[name];
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

    const prevComponent = this.view.app.model.data.elements.components[name];
    this.view.app.model.removeComponent(name);

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
    this.view.app.model.renameComponent(name, newName);

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

      const data = this.view.app.model.serializer.getState(state.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });

    this.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      const data = this.view.app.model.serializer.getTransition(transition.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });

    this.notes.forEach((note) => {
      if (!note.isSelected) return;

      const data = this.view.app.model.serializer.getNote(note.id);
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

    this.view.app.model.changeStateSelection(id, true);

    state.setIsSelected(true);
  }

  selectTransition(id: string) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    this.removeSelection();

    this.view.app.model.changeTransitionSelection(id, true);

    transition.setIsSelected(true);
  }

  selectNote(id: string) {
    const note = this.notes.get(id);
    if (!note) return;

    this.removeSelection();

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
      this.view.app.model.changeStateSelection(state.id, false);
      state.eventBox.selection = undefined;
    });

    this.transitions.forEach((transition) => {
      transition.setIsSelected(false);
      this.view.app.model.changeTransitionSelection(transition.id, false);
    });

    this.notes.forEach((note) => {
      note.setIsSelected(false);
    });

    this.view.isDirty = true;
  }

  getVacantComponents(): ComponentEntry[] {
    const components = this.view.app.model.data.elements.components;
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
