import { Container } from '@renderer/lib/basic';
import { State } from '@renderer/lib/drawable';
import { AddComponentParams } from '@renderer/lib/types/EditorManager';
import { EditComponentParams, RemoveComponentParams } from '@renderer/lib/types/MachineController';
import {
  Condition,
  Variable,
  NormalState as StateType,
  Transition as TransitionType,
  Note as NoteType,
} from '@renderer/types/diagram';

import { Initializer } from './Initializer';

import { History } from '../History';
import { NotesController } from '../NotesController';
import { ComponentEntry, PlatformManager, operatorSet } from '../PlatformManager';
import { StatesController } from '../StatesController';
import { TransitionsController } from '../TransitionsController';

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

export class MachineController {
  initializer!: Initializer;

  states!: StatesController;
  transitions!: TransitionsController;
  notes!: NotesController;

  platform!: PlatformManager;

  constructor(private container: Container, private history: History) {
    this.initializer = new Initializer(this.container, this);

    this.states = new StatesController(this.container, this.history);
    this.transitions = new TransitionsController(this.container, this.history);
    this.notes = new NotesController(this.container, this.history);
  }

  loadData() {
    this.initializer.init();

    this.container.isDirty = true;
  }

  // TODO
  /**
   * Обёртка для удобного создания {@link InitialState|маркера начального состояния}
   * или перестановки его на другое {@link State|состояние}
   */
  // setInitialState = (stateId: string, canUndo = true) => {
  //   const initialState = this.container.app.manager.data.elements.initialState;

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

  //   this.container.app.manager.changeInitialState(data);
  //   this.container.statesController.initInitialStateMark();

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'createInitialState',
  //       args: data,
  //     });
  //   }

  //   this.container.isDirty = true;
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
  //   this.container.app.manager.changeInitialState({
  //     target: newTargetId,
  //     position,
  //   });
  //   this.container.statesController.initInitialStateMark();

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'changeInitialState',
  //       args: { prevTargetId, newTargetId },
  //     });
  //   }

  //   this.container.isDirty = true;
  // };

  // /**
  //  * Изменение позиции {@link InitialState|маркера начального состояния}
  //  */
  // changeInitialStatePosition = (startPosition: Point, endPosition: Point, canUndo = true) => {
  //   const initialState = this.container.app.manager.data.elements.initialState;
  //   if (!initialState) return;

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'changeInitialStatePosition',
  //       args: { startPosition, endPosition },
  //     });
  //   }

  //   this.container.app.manager.changeInitialStatePosition(endPosition);

  //   this.container.isDirty = true;
  // };

  // getInitialStatePosition = () => {
  //   const initialState = this.container.app.manager.data.elements.initialState;
  //   if (!initialState) return null;
  //   return initialState.position;
  // };

  // deleteInitialState = (canUndo = true) => {
  //   const initialStateData = this.container.app.manager.data.elements.initialState;

  //   if (!initialStateData) return;

  //   if (canUndo) {
  //     this.undoRedo.do({
  //       type: 'deleteInitialState',
  //       args: initialStateData,
  //     });
  //   }

  //   this.container.statesController.clearInitialStateMark();
  //   this.container.app.manager.deleteInitialState();

  //   this.container.isDirty = true;
  // };

  addComponent(args: AddComponentParams, canUndo = true) {
    const { name, type } = args;

    this.container.app.manager.addComponent(args);

    this.platform.nameToVisual.set(name, {
      component: type,
    });

    this.container.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'addComponent',
        args: { args },
      });
    }
  }

  editComponent(args: EditComponentParams, canUndo = true) {
    const { name, parameters, newName } = args;

    const prevComponent = structuredClone(
      this.container.app.manager.data.elements.components[name]
    );

    this.container.app.manager.editComponent(name, parameters);

    const component = this.container.app.manager.data.elements.components[name];
    this.platform.nameToVisual.set(name, {
      component: component.type,
      label: component.parameters['label'],
      color: component.parameters['labelColor'],
    });

    if (newName) {
      this.renameComponent(name, newName);
    }

    this.container.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'editComponent',
        args: { args, prevComponent },
      });
    }
  }

  removeComponent(args: RemoveComponentParams, canUndo = true) {
    const { name, purge } = args;

    const prevComponent = this.container.app.manager.data.elements.components[name];
    this.container.app.manager.removeComponent(name);

    if (purge) {
      // TODO: «вымарывание» компонента из машины
      console.error('removeComponent purge not implemented yet');
    }

    this.platform.nameToVisual.delete(name);

    this.container.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'removeComponent',
        args: { args, prevComponent },
      });
    }
  }

  private renameComponent(name: string, newName: string) {
    this.container.app.manager.renameComponent(name, newName);

    const visualCompo = this.platform.nameToVisual.get(name);

    if (!visualCompo) return;

    this.platform.nameToVisual.set(newName, visualCompo);
    this.platform.nameToVisual.delete(name);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.states.forEachNormalStates((state) => {
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

    // TODO
    // this.transitions.forEach((value) => {
    //   if (value.data.trigger.component == name) {
    //     value.data.trigger.component = newName;
    //   }
    //   // do
    //   if (value.data.do) {
    //     for (const act of value.data.do) {
    //       if (act.component == name) {
    //         act.component = newName;
    //       }
    //     }
    //   }
    //   // condition
    //   if (value.data.condition) {
    //     this.renameCondition(value.data.condition, name, newName);
    //   }
    // });

    this.container.isDirty = true;
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
    this.states.forEachNormalStates((state) => {
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
    this.states.forEachNormalStates((state) => {
      if (!state.isSelected) return;

      const data = this.container.app.manager.serializer.getState(state.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });

    this.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      const data = this.container.app.manager.serializer.getTransition(transition.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });

    this.notes.forEach((note) => {
      if (!note.isSelected) return;

      const data = this.container.app.manager.serializer.getNote(note.id);
      if (!data) return;

      navigator.clipboard.writeText(data);
    });
  };

  pasteSelected = async () => {
    const data = await navigator.clipboard.readText();

    const copyData = JSON.parse(data) as StateType | TransitionType | NoteType;

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

    this.container.app.manager.changeStateSelection(id, true);

    state.setIsSelected(true);
  }

  selectTransition(id: string) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    this.removeSelection();

    this.container.app.manager.changeTransitionSelection(id, true);

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
    this.states.forEachNormalStates((state) => {
      state.setIsSelected(false);
      this.container.app.manager.changeStateSelection(state.id, false);
      state.eventBox.selection = undefined;
    });

    this.transitions.forEach((transition) => {
      transition.setIsSelected(false);
      this.container.app.manager.changeTransitionSelection(transition.id, false);
    });

    this.notes.forEach((note) => {
      note.setIsSelected(false);
    });

    this.container.isDirty = true;
  }

  getVacantComponents(): ComponentEntry[] {
    const components = this.container.app.manager.data.elements.components;
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
