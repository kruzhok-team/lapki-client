import {
  Action,
  Condition,
  Elements,
  Event,
  Component as ComponentType,
  Transition as TransitionType,
  Variable,
} from '@renderer/types/diagram';
import { Point } from '@renderer/types/graphics';
import { nanoid } from 'nanoid';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { Component } from '../Component';
import { State } from '../drawable/State';
import { Transition } from '../drawable/Transition';
import { ComponentEntry, PlatformManager, operatorSet } from './PlatformManager';
import { loadPlatform } from './PlatformLoader';
import { EventSelection } from '../drawable/Events';

export type DataUpdateCallback = (e: Elements, modified: boolean) => void;

/**
 * Данные машины состояний.
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
export class StateMachine extends EventEmitter {
  container!: Container;

  states: Map<string, State> = new Map();
  transitions: Map<string, Transition> = new Map();
  components: Map<string, Component> = new Map();

  platform!: PlatformManager;
  platformIdx!: string;
  parameters: Map<string, string> = new Map();

  dataUpdateCallback?: DataUpdateCallback;

  constructor(container: Container) {
    super();
    this.container = container;
  }

  loadData(elements: Elements) {
    this.initStates();
    this.initTransitions();
    this.initPlatform(elements.platform, elements.parameters);
    this.initComponents(elements.components);
  }

  onDataUpdate(fn?: DataUpdateCallback) {
    this.dataUpdateCallback = fn;
  }

  dataTrigger(silent?: boolean) {
    this.container.isDirty = true;
    this.dataUpdateCallback?.(this.graphData(), !silent);
  }

  clear() {
    this.transitions.forEach((value) => {
      this.container.transitions.unwatchTransition(value);
    });

    this.states.forEach((value) => {
      this.container.states.unwatchState(value);
    });
    // this.initialState = '';
    this.states.clear();
    this.components.clear();
    this.transitions.clear();
    this.parameters.clear();
    this.platformIdx = '';
    // FIXME: platform не обнуляется
  }

  graphData(): Elements {
    const states = {};
    const transitions: TransitionType[] = [];
    const components = {};
    const parameters = {};
    this.states.forEach((state, id) => {
      states[id] = state.toJSON();
    });
    this.components.forEach((component, id) => {
      components[id] = component.toJSON();
    });
    this.transitions.forEach((transition) => {
      transitions.push(transition.toJSON());
    });
    this.parameters.forEach((parameter, id) => {
      parameters[id] = parameter;
    });

    const outData = {
      states,
      // initialState: this.initialState,
      initialState: '',
      transitions,
      components,
      parameters,
      platform: this.platformIdx,
    };

    return outData;
  }

  initStates() {
    const items = this.container.app.manager.data.elements.states;

    for (const id in items) {
      const parent = this.states.get(items[id].parent ?? '');
      const state = new State(this.container, id, parent);

      state.parent?.children.set(id, state);
      this.container.states.watchState(state);
      this.states.set(id, state);
    }
  }

  initTransitions() {
    const items = this.container.app.manager.data.elements.transitions;

    for (const id in items) {
      const data = items[id];

      const sourceState = this.states.get(data.source) as State;
      const targetState = this.states.get(data.target) as State;

      const transition = new Transition({
        container: this.container,
        source: sourceState,
        target: targetState,
        id: id,
      });

      this.transitions.set(id, transition);

      this.container.transitions.watchTransition(transition);
    }
  }

  initComponents(items: Elements['components']) {
    for (const name in items) {
      const component = items[name];
      this.components.set(name, new Component(component));
      this.platform.nameToComponent.set(name, component.type);
    }
  }

  initPlatform(platformIdx: string, parameters: Elements['parameters']) {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platform = loadPlatform(platformIdx);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformIdx);
    }
    this.platform = platform;
    this.platformIdx = platformIdx;
    for (const paramName in parameters) {
      this.parameters.set(paramName, parameters[paramName]);
    }
    // TODO: валидировать список параметров?
  }

  newPictoState(id: string, events: Action[], triggerComponent: string, triggerMethod: string) {
    const state = this.states.get(id);
    if (typeof state === 'undefined') return;

    const trueTab = state.eventBox.data.find(
      (value) =>
        triggerComponent === value.trigger.component &&
        triggerMethod === value.trigger.method &&
        undefined === value.trigger.args // FIXME: сравнение по args может не работать
    );

    if (trueTab === undefined) {
      state.eventBox.data = [
        ...state.eventBox.data,
        {
          do: events,
          trigger: {
            component: triggerComponent,
            method: triggerMethod,
            //args: {},
          },
        },
      ];
    } else {
      trueTab.do = [...events];
    }

    state.eventBox.recalculate();
    this.dataTrigger();
  }

  createState(name: string, position: Point, parentId?: string) {
    // Создание данных
    const newStateId = this.container.app.manager.createState(name, position, parentId);
    // Создание модельки
    const state = new State(this.container, newStateId);

    this.states.set(state.id, state);

    // вкладываем состояние, если оно создано над другим
    if (parentId) {
      this.linkState(parentId, newStateId);
    } else {
      this.linkStateByPoint(state, position);
    }

    this.container.states.watchState(state);

    this.container.isDirty = true;
  }

  changeStateName(id: string, name: string) {
    this.container.app.manager.changeStateName(id, name);

    this.container.isDirty = true;
  }

  linkState(parentId: string, childId: string) {
    const parent = this.states.get(parentId);
    const child = this.states.get(childId);

    if (!parent || !child) return;

    if (child.data.parent) {
      this.unlinkState(childId);
    }

    // Вычисляем новую координату внутри контейнера
    const parentPos = parent.compoundPosition;
    const childPos = child.compoundPosition;
    const newBounds = {
      ...child.bounds,
      x: Math.max(0, childPos.x - parentPos.x),
      y: Math.max(0, childPos.y - parentPos.y - parent.bounds.height),
    };

    this.container.app.manager.linkState(parentId, childId);
    this.container.app.manager.changeStateBounds(childId, newBounds);

    child.parent = parent;
    parent.children.set(childId, child);

    this.container.isDirty = true;
  }

  linkStateByPoint(state: State, position: Point) {
    // назначаем родительское состояние по месту его создания
    let possibleParent: State | undefined = undefined;
    for (const item of this.states.values()) {
      if (state.id == item.id) continue;
      if (item.isUnderMouse(position, true)) {
        if (typeof possibleParent === 'undefined') {
          possibleParent = item;
        } else {
          // учитываем вложенность, нужно поместить состояние
          // в максимально дочернее
          let searchPending = true;
          while (searchPending) {
            searchPending = false;
            for (const child of possibleParent.children.values()) {
              if (!(child instanceof State)) continue;
              if (state.id == child.id) continue;
              if (child.isUnderMouse(position, true)) {
                possibleParent = child as State;
                searchPending = true;
                break;
              }
            }
          }
        }
      }
    }

    if (possibleParent !== state && possibleParent) {
      this.linkState(possibleParent.id, state.id);
    }
  }

  unlinkState(id: string) {
    const state = this.states.get(id);
    if (!state || !state.parent) return;

    this.container.app.manager.unlinkState(id);

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newBounds = { ...state.bounds, ...state.compoundPosition };
    this.container.app.manager.changeStateBounds(id, newBounds);

    state.parent.children.delete(id);
    state.parent = undefined;

    this.container.isDirty = true;
  }

  deleteState(id: string) {
    const state = this.states.get(id);
    if (!state) return;

    // Удаляем зависимые события, нужно это делать тут а нет в данных потому что модели тоже должны быть удалены и события на них должны быть отвязаны
    this.transitions.forEach((data, id) => {
      if (data.source.id === id || data.target.id === id) {
        this.deleteTransition(id);
      }
    });

    // Ищем дочерние состояния и отвязываем их от текущего, делать это нужно тут потому что поле children есть только в модели и его нужно поменять
    this.states.forEach((childState) => {
      if (childState.data.parent === id) {
        // Если есть родительское, перепривязываем к нему
        if (state.data.parent) {
          this.linkState(state.data.parent, childState.id);
        } else {
          this.unlinkState(childState.id);
        }
      }
    });

    // Отсоединяемся от родительского состояния, если такое есть. Опять же это нужно делать тут из-за поля children
    if (state.data.parent) {
      this.unlinkState(state.id);
    }

    this.container.app.manager.deleteState(id);

    this.container.states.unwatchState(state);
    this.states.delete(id);

    this.container.isDirty = true;
  }

  changeInitialState(idState: string) {
    this.container.app.manager.data.elements.initialState = idState;

    this.container.isDirty = true;
  }

  createTransition(
    source: State,
    target: State,
    color: string,
    component: string,
    method: string,
    doAction: Action[],
    condition: Condition | undefined
  ) {
    // Создание данных
    const id = this.container.app.manager.createTransition(
      source.id,
      target.id,
      color,
      {
        x: (source.bounds.x + target.bounds.x) / 2,
        y: (source.bounds.y + target.bounds.y) / 2,
      },
      component,
      method,
      doAction,
      condition
    );
    // Создание модельки
    const transition = new Transition({
      container: this.container,
      source: source,
      target: target,
      id,
    });

    this.transitions.set(id, transition);
    this.container.transitions.watchTransition(transition);

    this.container.isDirty = true;
  }

  changeTransition(
    id: string,
    color: string,
    component: string,
    method: string,
    doAction: Action[],
    condition: Condition | undefined
  ) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    this.container.app.manager.changeTransition(id, color, component, method, doAction, condition);

    this.container.isDirty = true;
  }

  deleteSelected() {
    let removed = false;

    const killList: string[] = [];
    this.states.forEach((state) => {
      if (state.isSelected) {
        if (state.eventBox.selection) {
          this.deleteEvent(state.id!, state.eventBox.selection);
          state.eventBox.selection = undefined;
          removed = true;
          return;
        } else {
          killList.push(state.id!);
        }
      }
    });
    for (const k of killList) {
      this.deleteState(k);
      removed = true;
    }

    killList.length = 0;

    this.transitions.forEach((value) => {
      if (value.condition.isSelected) {
        killList.push(value.id!);
      }
    });
    for (const k of killList) {
      this.deleteTransition(k);
      removed = true;
    }

    if (removed) {
      this.dataTrigger();
    }
  }

  deleteTransition(id: string) {
    const transition = this.transitions.get(id);
    if (!transition) return;

    this.container.app.manager.deleteTransition(id);

    this.container.transitions.unwatchTransition(transition);
    this.transitions.delete(id);

    this.container.isDirty = true;
  }

  // Редактирование события в состояниях
  createEvent(data: { state; event } | undefined, newValue: Event | Action) {
    const state = this.states.get(data?.state.id);
    if (typeof state === 'undefined') return;
    //Проверяем по условию, что мы редактируем, либо главное событие, либо действие
    if (data?.event.actionIdx === null) {
      const trueTab = state.eventBox.data.find(
        (value, id) =>
          data?.event.eventIdx !== id &&
          newValue.component === value.trigger.component &&
          newValue.method === value.trigger.method &&
          undefined === value.trigger.args // FIXME: сравнение по args может не работать
      );

      if (trueTab === undefined) {
        state.eventBox.data[data?.event.eventIdx].trigger = newValue;
      } else {
        trueTab.do = [...trueTab.do, ...state.eventBox.data[data?.event.eventIdx].do];
        state.eventBox.data.splice(data?.event.eventIdx, 1);
      }
    } else {
      state.eventBox.data[data?.event.eventIdx].do[data?.event.actionIdx] = newValue;
    }

    state.eventBox.recalculate();
    this.dataTrigger();
  }

  // Удаление события в состояниях
  //TODO показывать предупреждение при удалении события в в состоянии(модалка)
  deleteEvent(id: string, eventId: EventSelection) {
    const state = this.states.get(id);
    if (typeof state === 'undefined') return;

    if (eventId.actionIdx === null) {
      state.eventBox.data.splice(eventId.eventIdx, 1);
    } else {
      state.eventBox.data[eventId.eventIdx].do.splice(eventId.actionIdx!, 1);
      // Проверяем, есть ли действия в событие, если нет, то удалять его
      if (state.eventBox.data[eventId.eventIdx].do.length === 0) {
        state.eventBox.data.splice(eventId.eventIdx, 1);
      }
    }

    this.dataTrigger();
  }

  addNewComponent(name: string, type: string) {
    if (this.components.has(name)) {
      console.log(['bad new component', name, type]);
      return;
    }

    const component = new Component({
      type,
      parameters: {},
    });

    this.components.set(name, component);
    this.platform.nameToComponent.set(name, type);

    this.dataTrigger();
  }

  // Меняет только параметры, без имени
  editComponent(idx: string, newData: ComponentType, newName?: string) {
    const component = this.components.get(idx);
    if (typeof component === 'undefined') return;

    console.log(idx);
    console.log(newData);
    console.log(newName);

    // type присутствует, но мы его умышленно не трогаем
    component.data.parameters = newData.parameters;

    if (newName) {
      this.renameComponentRaw(idx, newName);
    }

    this.dataTrigger();
  }

  private renameComponentRaw(idx: string, newName: string) {
    const component = this.components.get(idx);
    if (typeof component === 'undefined') return;

    this.components.set(newName, component);
    this.components.delete(idx);

    this.platform.nameToComponent.set(newName, component.data.type);
    this.platform.nameToComponent.delete(idx);

    // А сейчас будет занимательное путешествие по схеме с заменой всего
    this.states.forEach((state) => {
      for (const ev of state.eventBox.data) {
        // заменяем в триггере
        if (ev.trigger.component == idx) {
          ev.trigger.component = newName;
        }
        for (const act of ev.do) {
          // заменяем в действии
          if (act.component == idx) {
            act.component = newName;
          }
        }
      }
    });

    this.transitions.forEach((value) => {
      if (value.data.trigger.component == idx) {
        value.data.trigger.component = newName;
      }
      // do
      if (value.data.do) {
        for (const act of value.data.do) {
          if (act.component == idx) {
            act.component = newName;
          }
        }
      }
      // condition
      if (value.data.condition) {
        this.renameCondition(value.data.condition, idx, newName);
      }
    });
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

  removeComponent(name: string, purge?: boolean) {
    if (!this.components.has(name)) return;

    if (purge) {
      // TODO: «вымарывание» компонента из машины
      console.error('removeComponent purge not implemented yet');
    }

    this.components.delete(name);
    this.platform.nameToComponent.delete(name);

    this.dataTrigger();
  }

  undo() {
    // FIXME: очень нужно
    console.warn('😿 🔙 not implemened yet');
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
      state.setIsSelected(false);
      state.eventBox.selection = undefined;
    });

    this.transitions.forEach((value) => {
      value.condition.setIsSelected(false);
    });

    this.container.isDirty = true;
  }

  getVacantComponents(): ComponentEntry[] {
    const vacant: ComponentEntry[] = [];
    for (const idx in this.platform.data.components) {
      const compo = this.platform.data.components[idx];
      if (compo.singletone && this.components.has(idx)) continue;
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
