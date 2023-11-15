import { State } from './State';
import { Transition } from './Transition';

import { MachineController } from '../data/MachineController';

type CbListItem = State | Transition;
/**
 * Пока что это странный класс предназначенный только для отрисовки,
 * у {@link Container} и {@link Node} объявляется этот класс и рендер идёт по дереву
 * Плюс у переходов приоритет на отрисовку, в своём слое они всегда выше
 */
export class Children {
  private statesList = [] as string[];
  private transitionsList = [] as string[];

  constructor(public stateMachine: MachineController) {}

  forEach(cb: (item: CbListItem) => void) {
    this.statesList.forEach((id) => {
      cb(this.stateMachine.states.get(id) as State);
    });

    this.transitionsList.forEach((id) => {
      cb(this.stateMachine.transitions.get(id) as Transition);
    });
  }

  forEachState(cb: (item: State) => void) {
    this.statesList.forEach((id) => {
      cb(this.stateMachine.states.get(id) as State);
    });
  }

  getTransitionIds() {
    return [...this.transitionsList];
  }

  clearTransitions() {
    this.transitionsList.length = 0;
  }

  clear() {
    this.statesList.length = 0;
    this.transitionsList.length = 0;
  }

  // Для того чтобы можно было перебрать экземпляр класса с помощью for of
  [Symbol.iterator]() {
    let i = 0;
    const statesList = this.statesList;
    const transitionsList = this.transitionsList;
    const stateMachine = this.stateMachine;
    const size = this.size;

    return {
      next() {
        if (i >= size) {
          return { value: undefined, done: true };
        }

        if (i < statesList.length) {
          const id = statesList[i++];
          const state = stateMachine.states.get(id) as State;
          return { value: state, done: false };
        }

        const id = transitionsList[i - statesList.length];
        i++;

        const transition = stateMachine.transitions.get(id) as Transition;
        return { value: transition, done: false };
      },
    };
  }

  add(type: 'state' | 'transition', id: string) {
    if (type === 'state') {
      this.statesList.push(id);
    }
    if (type === 'transition') {
      this.transitionsList.push(id);
    }
  }

  remove(type: 'state' | 'transition', id: string) {
    const list = type === 'state' ? this.statesList : this.transitionsList;
    const index = list.findIndex((item) => id === item);

    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  getStateByIndex(index: number) {
    const id = this.statesList[index];

    return this.stateMachine.states.get(id);
  }

  getByIndex(index: number) {
    if (index < this.statesList.length) {
      const id = this.statesList[index];

      return this.stateMachine.states.get(id) as State;
    }

    const id = this.transitionsList[index - this.statesList.length];

    return this.stateMachine.transitions.get(id) as Transition;
  }

  moveToEnd(type: 'state' | 'transition', id: string) {
    const list = type === 'state' ? this.statesList : this.transitionsList;

    const index = list.findIndex((item) => id === item);

    list.splice(list.length - 1, 0, list.splice(index, 1)[0]);
  }

  get size() {
    return this.statesList.length + this.transitionsList.length;
  }

  get isEmpty() {
    return this.size === 0;
  }

  get statesSize() {
    return this.statesList.length;
  }
}
