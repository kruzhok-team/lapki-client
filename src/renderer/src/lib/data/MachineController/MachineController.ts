import { BaseState } from '@renderer/lib/drawable/Node/BaseState';
import { State } from '@renderer/lib/drawable/Node/State';
import { Note } from '@renderer/lib/drawable/Note';
import {
  Action,
  Condition,
  Event,
  Variable,
  INormalState as StateType,
  Transition as TransitionType,
  Note as NoteType,
  EventData,
} from '@renderer/types/diagram';
import {
  AddComponentParams,
  ChangeStateEventsParams,
  ChangeTransitionParams,
  CreateNoteParams,
  CreateStateParams,
} from '@renderer/types/EditorManager';
import { Point } from '@renderer/types/graphics';
import {
  CreateTransitionParameters,
  EditComponentParams,
  RemoveComponentParams,
  UnlinkStateParams,
} from '@renderer/types/MachineController';
import { indexOfMin } from '@renderer/utils';

import { Initializer } from './Initializer';

import { Container } from '../../basic/Container';
import { EventSelection } from '../../drawable/Events';
import { Transition } from '../../drawable/Transition';
import { History } from '../History';
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

export class MachineController {
  initializer = new Initializer(this);

  states: Map<string, BaseState> = new Map();
  transitions: Map<string, Transition> = new Map();
  notes: Map<string, Note> = new Map();

  platform!: PlatformManager;

  constructor(private container: Container, private history: History) {}

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

  createTransition(params: CreateTransitionParameters, canUndo = true) {
    const { source, target, color, component, method, doAction, condition, id: prevId } = params;

    const sourceState = this.states.get(source);
    const targetState = this.states.get(target);

    if (!sourceState || !targetState) return;

    const position = params.position ?? {
      x: (sourceState.position.x + targetState.position.x) / 2,
      y: (sourceState.position.y + targetState.position.y) / 2,
    };

    // Создание данных
    const id = this.container.app.manager.createTransition({
      id: prevId,
      source,
      target,
      color,
      position,
      component,
      method,
      doAction,
      condition,
    });
    // Создание модельки
    const transition = new Transition(this.container, id);

    this.transitions.set(id, transition);
    this.linkTransition(id);

    this.container.transitionsController.watchTransition(transition);

    this.container.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'createTransition',
        args: { id, params },
      });
    }
  }

  linkTransition(id: string) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    // Убираем из предыдущего родителя
    transition.source.parent?.children.remove('transition', id);
    transition.target.parent?.children.remove('transition', id);

    if (!transition.source.parent || !transition.target.parent) {
      this.container.children.add('transition', transition.id);
      transition.parent = undefined;
    } else {
      this.container.children.remove('transition', id);

      const possibleParents = [transition.source.parent, transition.target.parent].filter(Boolean);
      const possibleParentsDepth = possibleParents.map((p) => p?.getDepth() ?? 0);
      const parent = possibleParents[indexOfMin(possibleParentsDepth)] ?? this.container;

      if (parent instanceof State) {
        transition.parent = parent;
      }

      parent.children.add('transition', transition.id);
    }
  }

  changeTransition(args: ChangeTransitionParams, canUndo = true) {
    const transition = this.transitions.get(args.id);
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'changeTransition',
        args: { transition, args, prevData: structuredClone(transition.data) },
      });
    }

    this.container.app.manager.changeTransition(args);

    this.container.isDirty = true;
  }

  changeTransitionPosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'changeTransitionPosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.container.app.manager.changeTransitionPosition(id, endPosition);

    this.container.isDirty = true;
  }

  deleteTransition(id: string, canUndo = true) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    if (canUndo) {
      this.history.do({
        type: 'deleteTransition',
        args: { transition, prevData: structuredClone(transition.data) },
      });
    }

    this.container.app.manager.deleteTransition(id);

    const parent = transition.parent ?? this.container;
    parent.children.remove('transition', id);
    this.container.transitionsController.unwatchTransition(transition);
    this.transitions.delete(id);

    this.container.isDirty = true;
  }

  createEvent(stateId: string, eventData: EventData, eventIdx?: number) {
    const state = this.states.get(stateId);
    if (!state) return;

    this.container.app.manager.createEvent(stateId, eventData, eventIdx);

    state.updateEventBox();

    this.container.isDirty = true;
  }

  createEventAction(stateId: string, event: EventSelection, value: Action) {
    const state = this.states.get(stateId);
    if (!state) return;

    this.container.app.manager.createEventAction(stateId, event, value);

    state.updateEventBox();

    this.container.isDirty = true;
  }

  // Редактирование события в состояниях
  changeEvent(stateId: string, event: EventSelection, newValue: Event | Action, canUndo = true) {
    const state = this.states.get(stateId);
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.container.app.manager.changeEventAction(stateId, event, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEventAction',
          args: { stateId, event, newValue, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx].trigger;

      this.container.app.manager.changeEvent(stateId, eventIdx, newValue);

      if (canUndo) {
        this.history.do({
          type: 'changeEvent',
          args: { stateId, event, newValue, prevValue },
        });
      }
    }

    state.updateEventBox();

    this.container.isDirty = true;
  }

  // Удаление события в состояниях
  //TODO показывать предупреждение при удалении события в состоянии(модалка)
  deleteEvent(stateId: string, event: EventSelection, canUndo = true) {
    const state = this.states.get(stateId);
    if (!state) return;

    const { eventIdx, actionIdx } = event;

    if (actionIdx !== null) {
      // Проверяем если действие в событие последнее то надо удалить всё событие
      if (state.data.events[eventIdx].do.length === 1) {
        return this.deleteEvent(stateId, { eventIdx, actionIdx: null });
      }

      const prevValue = state.data.events[eventIdx].do[actionIdx];

      this.container.app.manager.deleteEventAction(stateId, event);

      if (canUndo) {
        this.history.do({
          type: 'deleteEventAction',
          args: { stateId, event, prevValue },
        });
      }
    } else {
      const prevValue = state.data.events[eventIdx];

      this.container.app.manager.deleteEvent(stateId, eventIdx);

      if (canUndo) {
        this.history.do({
          type: 'deleteEvent',
          args: { stateId, eventIdx, prevValue },
        });
      }
    }

    state.updateEventBox();

    this.container.isDirty = true;
  }

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

    const visualCompo = this.platform.nameToVisual.get(name)!;
    this.platform.nameToVisual.set(newName, visualCompo);
    this.platform.nameToVisual.delete(name);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.states.forEach((state) => {
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

    this.transitions.forEach((value) => {
      if (value.data.trigger.component == name) {
        value.data.trigger.component = newName;
      }
      // do
      if (value.data.do) {
        for (const act of value.data.do) {
          if (act.component == name) {
            act.component = newName;
          }
        }
      }
      // condition
      if (value.data.condition) {
        this.renameCondition(value.data.condition, name, newName);
      }
    });

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
    this.states.forEach((state) => {
      if (!state.isSelected) return;

      if (state.eventBox.selection) {
        this.deleteEvent(state.id, state.eventBox.selection);
        state.eventBox.selection = undefined;
        return;
      }

      this.container.statesController.deleteState(state.id);
    });

    this.transitions.forEach((transition) => {
      if (!transition.isSelected) return;

      this.deleteTransition(transition.id);
    });

    this.notes.forEach((note) => {
      if (!note.isSelected) return;

      this.deleteNote(note.id);
    });
  };

  copySelected = () => {
    this.states.forEach((state) => {
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
      return this.container.statesController.createState({
        name: copyData.name,
        position: copyData.position,
        events: copyData.events,
        parentId: copyData.parentId,
      });
    }

    if ('text' in copyData) {
      return this.createNote(copyData);
    }

    return this.createTransition({
      ...copyData,
      component: copyData.trigger.component,
      method: copyData.trigger.method,
      doAction: copyData.do ?? [],
      condition: copyData.condition ?? undefined,
    });
  };

  selectState(id: string) {
    const state = this.states.get(id);
    if (!state) return;

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
    this.states.forEach((state) => {
      if (state instanceof State) {
        state.setIsSelected(false);
        this.container.app.manager.changeStateSelection(state.id, false);
        state.eventBox.selection = undefined;
      }
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

  createNote(params: CreateNoteParams, canUndo = true) {
    const newNoteId = this.container.app.manager.createNote(params);
    const note = new Note(this.container, newNoteId);

    this.notes.set(newNoteId, note);
    this.container.notesController.watch(note);
    this.container.children.add('note', newNoteId);

    this.container.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'createNote',
        args: { id: newNoteId, params },
      });
    }

    return note;
  }

  changeNoteText = (id: string, text: string, canUndo = true) => {
    const note = this.notes.get(id);
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'changeNoteText',
        args: { id, text, prevText: note.data.text },
      });
    }

    this.container.app.manager.changeNoteText(id, text);
    note.prepareText();

    this.container.isDirty = true;
  };

  changeNotePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const note = this.notes.get(id);
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'changeNotePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.container.app.manager.changeNotePosition(id, endPosition);

    this.container.isDirty = true;
  }

  deleteNote(id: string, canUndo = true) {
    const note = this.notes.get(id);
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'deleteNote',
        args: { id, prevData: structuredClone(note.data) },
      });
    }

    this.container.app.manager.deleteNote(id);

    this.container.children.remove('note', id);
    this.container.notesController.unwatch(note);
    this.notes.delete(id);

    this.container.isDirty = true;
  }
}
