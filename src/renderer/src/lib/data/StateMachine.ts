import { Elements } from '@renderer/types/diagram';
import { Component } from '../Component';
import { Transition as TransitionType } from '@renderer/types/diagram';
import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { State } from '../drawable/State';
import { Transition } from '../drawable/Transition';
import { customAlphabet, nanoid } from 'nanoid';
import { Point } from '@renderer/types/graphics';
import { stateStyle } from '../styles';

/**
 * Данные машины состояний.
 * Хранит все состояния и переходы, предоставляет интерфейс
 * для работы с ними. Не отвечает за графику и события (эта логика
 * вынесена в контроллеры)
 *
 * @remark
 * Все изменения, вносимые на уровне данных, должны происходить
 * здесь. Сюда закладывается история правок, импорт и экспорт.
 */

// FIXME: оптимизация: в сигнатуры функций можно поставить что-то типа (string | State),
//        чтобы через раз не делать запрос в словарь

// TODO Образовалось массивное болото, что не есть хорошо, надо додумать чем заменить переборы этих массивов.
export class StateMachine extends EventEmitter {
  container!: Container;
  initialState: string = '';
  states: Map<string, State> = new Map();
  transitions: Map<string, Transition> = new Map();
  components: Map<string, Component> = new Map<string, Component>();

  constructor(container: Container) {
    super();
    this.container = container;
  }

  loadData(elements: Elements) {
    this.initStates(elements.states, elements.initialState);
    this.initTransitions(elements.transitions);
    this.initComponents(elements.components);
  }

  graphData() {
    return {
      states: { ...Object.fromEntries(this.states) },
      initialState: this.initialState,
      transitions: [...this.transitions.values()],
      components: { ...Object.fromEntries(this.components) },
    };
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
    for (const component_name in items) {
      this.components.set(component_name, new Component(items[component_name]));
    }
  }

  initTransitions(items: Elements['transitions']) {
    for (const id in items) {
      const data = items[id];

      const sourceState = this.states.get(data.source) as State;
      const targetState = this.states.get(data.target) as State;

      const transition = new Transition(this.container, sourceState, targetState, data, id);

      this.transitions.set(id, transition);

      this.container.transitions.watchTransition(transition);
    }
  }

  // TODO: разбить действия над состоянием, переименование идёт отдельно, события отдельно
  // FIXME: в разработке (работает только переименование)
  updateState(id: string, newName: string, events: string, component: string, method: string) {
    const state = this.states.get(id);
    if (typeof state === 'undefined') return;

    state.data.name = newName;

    this.container.isDirty = true;
  }

  createNewState(name: string, position: Point) {
    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;
    const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);
    var newId = nanoid();
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

    // назначаем родительское состояние по месту его создания
    let possibleParent: State | undefined = undefined;
    for (const item of this.states.values()) {
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

    // кладём состояние в список
    // делаем это сейчас, потому что иначе не сможем присоединить родительское
    this.states.set(state.id!, state);

    if (typeof possibleParent !== 'undefined') {
      this.linkState(possibleParent.id!, state.id!);
    }

    this.container.states.watchState(state);
    this.container.isDirty = true;
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
  }

  unlinkState(id: string) {
    const state = this.states.get(id);
    if (typeof state === 'undefined') return;
    if (typeof state!.parent === 'undefined') return;

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newBound = { ...state!.bounds, ...state!.compoundPosition };

    state!.parent?.children.delete(id);
    state!.parent = undefined;
    delete state!.data.parent;

    state!.bounds = newBound;

    this.container.isDirty = true;
  }

  //TODO необходимо придумать очистку события на удалённые объекты
  deleteState(idState: string) {
    const state = this.states.get(idState);
    console.log(state);
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
        if (state!.data.parent) {
          this.linkState(state!.data.parent!, childState.id!);
        } else {
          this.unlinkState(childState.id!);
        }
      }
    });

    // Отсоединяемся от родительского состояния, если такое есть
    if (state!.data.parent) {
      this.unlinkState(state.id!);
    }

    // Если удаляемое состояние было начальным, стираем текущее значение
    if (state!.isInitial) {
      this.initialState = '';
    }

    this.container.states.unwatchState(state);

    this.states.delete(idState);
    this.container.isDirty = true;
  }

  // Изменение начального состояния
  changeInitialState(idState: string) {
    const newInitial = this.states.get(idState);
    if (typeof newInitial === 'undefined') return;

    const preInitial = this.states.get(this.initialState);
    if (typeof preInitial !== 'undefined') {
      preInitial!.isInitial = false;
    }

    newInitial!.isInitial = true;

    this.initialState = idState;

    this.container.isDirty = true;
  }

  //Удаление связей
  deleteTransition(id: string) {
    const transition = this.transitions.get(id);
    if (typeof transition === 'undefined') return;

    this.container.transitions.unwatchTransition(transition);
    this.transitions.delete(id);

    this.container.isDirty = true;
  }

  createNewTransitionFromData(
    source: State,
    target: State,
    transitionData: TransitionType,
    id?: string
  ) {
    const newId = typeof id !== 'undefined' ? id! : nanoid();
    const transition = new Transition(this.container, source, target, transitionData, newId);

    this.transitions.set(newId, transition);

    this.container.transitions.watchTransition(transition);
    this.container.isDirty = true;
  }

  createNewTransition(
    source: State,
    target: State,
    color: string,
    component: string,
    method: string,
    pos?: Point,
    id?: string
  ) {
    // TODO Доделать парвильный condition
    const position =
      typeof pos !== 'undefined'
        ? pos!
        : {
            x: 100,
            y: 100,
          };
    const transitionData = {
      source: source.id!,
      target: target.id!,
      color,
      position,
      trigger: {
        component,
        method,
      },
    };
    this.createNewTransitionFromData(source, target, transitionData, id);
  }

  /**
   * Снимает выделение со всех нод и переходов.
   *
   * @remark Выполняется при изменении выделения.
   * Возможно, надо переделать структуру, чтобы не пробегаться по списку каждый раз.
   */
  removeSelection() {
    this.states.forEach((state) => {
      state.setIsSelected(false, '');
    });

    this.transitions.forEach((value) => {
      value.condition.setIsSelected(false, '');
    });

    this.container.isDirty = true;
  }
}
