import { Condition, Elements } from '@renderer/types/diagram';
import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { State } from '../drawable/State';
import { Transition } from '../drawable/Transition';
import { nanoid } from 'nanoid';
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
export class StateMachine extends EventEmitter {
  container!: Container;

  states: Map<string, State> = new Map();
  transitions: Map<string, Transition> = new Map();

  isDirty = true;

  constructor(container: Container) {
    super();
    this.container = container;
  }

  initStates(items: Elements['states'], initialState: string) {
    for (const id in items) {
      const parent = this.states.get(items[id].parent ?? '');
      const state = new State({
        container: this.container,
        id: id,
        data: items[id],
        parent,
        initial: id === initialState,
      });

      state.parent?.children.set(id, state);
      this.container.states.watchState(state);
      this.states.set(id, state);
    }
  }

  initTransitions(items: Elements['transitions']) {
    for (const id in items) {
      const { source, target, condition, color } = items[id];

      const sourceState = this.states.get(source) as State;
      const targetState = this.states.get(target) as State;

      const transition = new Transition(this.container, sourceState, targetState, color, condition);

      this.transitions.set(id, transition);

      this.container.transitions.watchTransition(transition);
    }
  }

  createState(name: string, events: string, component: string, method: string) {
    const { width, height } = stateStyle;
    const x = 200 - width / 2;
    const y = 200 - height / 2;

    var startEvents = {};
    startEvents[events] = { component, method };

    const state = new State({
      container: this.container,
      id: name,
      data: {
        bounds: { x, y, width, height },
        events: startEvents,
      },
    });

    this.states.set(name, state);

    this.container.states.watchState(state);
    this.container.isDirty = true;
  }

  createNewState(name: string, position: Point) {
    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;

    const state = new State({
      container: this.container,
      id: name,
      data: {
        bounds: { x, y, width, height },
        events: {},
      },
    });

    for (const item of this.states.values()) {
      state.parent = item;
      item?.children.set(state.id, state);
      break;
    }

    this.states.set(name, state);

    for (const item of this.states.values()) {
      if (item.isUnderMouse({ x, y })) {
        state.parent = item;
        item?.children.set(state.id, state);
        break;
      }
    }
    this.container.states.watchState(state);
    this.container.isDirty = true;
  }

  deleteState(name: string) {
    this.states.forEach((_data, thisName) => {
      if (thisName === name) {
        this.states.delete(name);
      }
      // TODO: удалять все переходы с этим состоянием
      // TODO: удалять все дочерние ноды (или отсоединять?)
      // TODO: удалить эту ноду у родительской (если есть)
    });

    this.container.isDirty = true;
  }

  createNewTransitionCond(
    source: State,
    target: State,
    color: string,
    condition: Condition,
    id?: string
  ) {
    const transition = new Transition(this.container, source, target, color, condition);

    const newId = typeof id !== 'undefined' ? id! : nanoid();
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
    position?: Point,
    id?: string
  ) {
    // TODO Доделать парвильный condition
    const condition = {
      position:
        typeof position !== 'undefined'
          ? position!
          : {
              x: 100,
              y: 100,
            },
      component,
      method,
    };
    this.createNewTransitionCond(source, target, color, condition, id);
  }
}
