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

    // назначаем родительское состояние по месту его создания
    let possibleParent: State | undefined = undefined;
    for (const item of this.states.values()) {
      if (item.isUnderMouse(state.computedPosition)) {
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
              if (child.isUnderMouse(state.computedPosition)) {
                possibleParent = child as State;
                searchPending = true;
                break;
              }
            }
          }
        }
      }
    }
    if (typeof possibleParent !== 'undefined') {
      state.parent = possibleParent;
      possibleParent?.children.set(state.id, state);
    }

    this.states.set(name, state);

    this.container.states.watchState(state);
    this.container.isDirty = true;
  }

  unlinkState(name: string) {
    const state = this.states.get(name);
    if (typeof state === 'undefined') return;
    if (typeof state!.parent === 'undefined') return;

    // Вычисляем новую координату, потому что после отсоединения родителя не сможем.
    const newBound = {...state!.bounds, ...state!.compoundPosition};
    
    state!.parent?.children.delete(name);
    state!.parent = undefined;
    delete state!.data['parent'];

    state!.bounds = newBound;

    this.container.isDirty = true;
  }

  deleteState(name: string) {
    const state = this.states.get(name);
    if (typeof state === 'undefined') return;
    
    this.states.delete(name);

    //Проходим массив связей, если же есть связи у удаляемой ноды, то они тоже удаляются
    this.transitions.forEach((data, id) => {
      if (data.source.id === name || data.target.id === name) {
        this.transitions.delete(id);
      }
    });
    
    // TODO: удалять все дочерние ноды (или отсоединять?) при удалении родителя
    
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
