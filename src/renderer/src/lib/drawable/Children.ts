import { Shape } from './Shape';
import { State } from './State';
import { Transition } from './Transition';

import { MachineController } from '../data/MachineController';

type ListType = 'state' | 'transition' | 'note';

/**
 * Пока что это странный класс предназначенный только для отрисовки,
 * у {@link Container} и {@link Shape} объявляется этот класс и рендер идёт по дереву
 * Плюс у переходов приоритет на отрисовку, в своём слое они всегда выше
 */
export class Children {
  private statesList = [] as string[];
  private transitionsList = [] as string[];
  private notesList = [] as string[];

  constructor(public stateMachine: MachineController) {}

  private getList(type: ListType) {
    if (type === 'state') {
      return this.statesList;
    }
    if (type === 'transition') {
      return this.transitionsList;
    }
    return this.notesList;
  }

  forEach(cb: (item: Shape) => void) {
    this.statesList.forEach((id) => {
      cb(this.stateMachine.states.get(id) as Shape);
    });

    this.transitionsList.forEach((id) => {
      cb(this.stateMachine.transitions.get(id) as Shape);
    });

    this.notesList.forEach((id) => {
      cb(this.stateMachine.notes.get(id) as Shape);
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
    this.notesList.length = 0;
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

  add(type: ListType, id: string) {
    const list = this.getList(type);

    list.push(id);
  }

  remove(type: ListType, id: string) {
    const list = this.getList(type);
    const index = list.findIndex((item) => id === item);

    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  getStateByIndex(index: number) {
    const id = this.statesList[index];

    return this.stateMachine.states.get(id);
  }

  getByIndex(index: number): Shape | undefined {
    if (index < this.statesList.length) {
      const id = this.statesList[index];

      return this.stateMachine.states.get(id);
    }

    index -= this.statesList.length;

    if (index < this.transitionsList.length) {
      const id = this.transitionsList[index];

      return this.stateMachine.transitions.get(id);
    }

    const id = this.notesList[index - this.transitionsList.length];

    return this.stateMachine.notes.get(id);
  }

  moveToEnd(type: ListType, id: string) {
    const list = this.getList(type);

    const index = list.findIndex((item) => id === item);

    if (index !== -1) {
      list.splice(list.length - 1, 0, list.splice(index, 1)[0]);
    }
  }

  get size() {
    return this.statesList.length + this.transitionsList.length + this.notesList.length;
  }

  get isEmpty() {
    return this.size === 0;
  }

  get statesSize() {
    return this.statesList.length;
  }
}
