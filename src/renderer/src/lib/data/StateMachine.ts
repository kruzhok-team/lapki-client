import {
  Action,
  Condition,
  Elements,
  Event,
  Component as ComponentType,
  Transition as TransitionType,
} from '@renderer/types/diagram';
import { Point } from '@renderer/types/graphics';
import { customAlphabet, nanoid } from 'nanoid';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { Component } from '../Component';
import { State } from '../drawable/State';
import { Transition } from '../drawable/Transition';
import { stateStyle } from '../styles';
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

  initialState = '';
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
    this.initStates(elements.states, elements.initialState);
    this.initTransitions(elements.transitions);
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
    this.initialState = '';
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
      initialState: this.initialState,
      transitions,
      components,
      parameters,
      platform: this.platformIdx,
    };

    return outData;
  }

  initStates(items: Elements['states'], initialState: string) {
    this.initialState = initialState;

    for (const id in items) {
      const parent = this.states.get(items[id].parent ?? '');
      const state = new State({
        container: this.container,
        id,
        data: items[id],
        parent,
        initial: id === initialState,
      });

      state.parent?.children.set(id, state);
      this.container.states.watchState(state);
      this.states.set(id, state);
    }
  }

  initComponents(items: Elements['components']) {
    for (const name in items) {
      const component = items[name];
      this.components.set(name, new Component(component));
      this.platform.nameToComponent.set(name, component.type);
    }
  }

  initTransitions(items: Elements['transitions']) {
    for (const id in items) {
      const data = items[id];

      const sourceState = this.states.get(data.source) as State;
      const targetState = this.states.get(data.target) as State;

      const transition = new Transition({
        container: this.container,
        source: sourceState,
        target: targetState,
        data: data,
        id: id,
      });

      this.transitions.set(id, transition);

      this.container.transitions.watchTransition(transition);
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

  updateState(id: string, name: string) {
    const state = this.states.get(id);
    if (typeof state === 'undefined') return;

    state.data.name = name;

    this.dataTrigger();
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

    if (possibleParent !== state && typeof possibleParent !== 'undefined') {
      this.linkState(possibleParent.id!, state.id!);
    }
  }

  createNewState(name: string, position: Point) {
    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;
    const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);
    let newId = nanoid();
    while (this.states.has(newId)) {
      newId = nanoid();
    }
    const state = new State({
      container: this.container,
      id: newId,
      data: {
        name: name,
        bounds: { x, y, width, height },
        events: [],
      },
    });

    // если у нас не было начального состояния, им станет новое
    if (this.initialState === '') {
      this.initialState = state.id!;
    }

    // кладём состояние в список
    this.states.set(state.id!, state);

    // вкладываем состояние, если оно создано над другим
    this.linkStateByPoint(state, position);

    this.container.states.watchState(state);
    this.dataTrigger();
  }

  linkState(parentId: string, childId: string) {
    const parent = this.states.get(parentId);
    if (typeof parent === 'undefined') return;
    const child = this.states.get(childId);
    if (typeof child === 'undefined') return;

    if (typeof child.parent !== 'undefined') {
      this.unlinkState(childId);
    }

    // Вычисляем новую координату внутри контейнера
    const parentPos = parent.compoundPosition;
    const childPos = child.compoundPosition;
    const newBound = {
      ...child.bounds,
      x: Math.max(0, childPos.x - parentPos.x),
      y: Math.max(0, childPos.y - parentPos.y - parent.bounds.height),
    };

    child.parent = parent;
    child.data.parent = parentId;
    parent?.children.set(child.id!, child);

    child.bounds = newBound;

    this.dataTrigger();
  }

  unlinkState(id: string) {
    const state = this.states.get(id);
    if (typeof state === 'undefined') return;
    if (typeof state.parent === 'undefined') return;

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newBound = { ...state.bounds, ...state.compoundPosition };

    state.parent?.children.delete(id);
    state.parent = undefined;
    delete state.data.parent;

    state.bounds = newBound;

    this.dataTrigger();
  }

  //Удаление состояния
  deleteState(idState: string) {
    const state = this.states.get(idState);
    if (typeof state === 'undefined') return;

    //Проходим массив связей, если же связи у удаляемой ноды имеются, то они тоже удаляются
    this.transitions.forEach((data, id) => {
      if (data.source.id === idState || data.target.id === idState) {
        this.deleteTransition(id);
      }
    });

    // Ищем дочерние состояния и отвязываем их от текущего
    this.states.forEach((childState) => {
      if (childState.data.parent === idState) {
        // Если есть родительское, перепривязываем к нему
        if (state.data.parent) {
          this.linkState(state.data.parent, childState.id!);
        } else {
          this.unlinkState(childState.id!);
        }
      }
    });

    // Отсоединяемся от родительского состояния, если такое есть
    if (state.data.parent) {
      this.unlinkState(state.id!);
    }

    // Если удаляемое состояние было начальным, стираем текущее значение
    if (state.isInitial) {
      this.initialState = '';
    }

    this.container.states.unwatchState(state);

    this.states.delete(idState);
    this.dataTrigger();
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

  // Изменение начального состояния
  changeInitialState(idState: string) {
    const newInitial = this.states.get(idState);
    if (typeof newInitial === 'undefined') return;

    const preInitial = this.states.get(this.initialState);
    if (typeof preInitial !== 'undefined') {
      preInitial.isInitial = false;
    }

    newInitial.isInitial = true;

    this.initialState = idState;

    this.dataTrigger();
  }

  // Удаление связи
  deleteTransition(id: string) {
    const transition = this.transitions.get(id);
    if (typeof transition === 'undefined') return;

    this.container.transitions.unwatchTransition(transition);
    this.transitions.delete(id);

    this.dataTrigger();
  }

  createNewTransitionFromData(
    source: State,
    target: State,
    transitionData: TransitionType,
    id?: string
  ) {
    const newId = typeof id !== 'undefined' ? id : nanoid();
    const transition = new Transition({
      container: this.container,
      source: source,
      target: target,
      data: transitionData,
      id: newId,
    });

    // FIXME: по-хорошему, должно быть редактированием, но пока перестрахуемся
    if (this.transitions.has(newId)) {
      this.container.transitions.unwatchTransition(this.transitions.get(newId)!);
    }

    this.transitions.set(newId, transition);

    this.container.transitions.watchTransition(transition);
    this.dataTrigger();
  }

  // Создание новой связи между состояниями и редактирование уже созданных
  createNewTransition(
    id: string | undefined,
    source: State,
    target: State,
    color: string,
    component: string,
    method: string,
    doAction: Action[],
    condition: Condition | undefined,
    position: Point
  ) {
    if (id !== undefined) {
      const transition = this.transitions.get(id);
      if (typeof transition === 'undefined') return;
    }

    const transitionData = {
      source: source.id!,
      target: target.id!,
      color,
      position,
      trigger: {
        component,
        method,
      },
      do: doAction,
      condition,
    };
    this.createNewTransitionFromData(source, target, transitionData, id);
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
      if (ac.value.component === oldName) {
        ac.value.component = newName;
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
