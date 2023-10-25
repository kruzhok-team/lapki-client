import { State } from './State';
import { Transition } from './Transition';

import { StateMachine } from '../data/StateMachine';

type CbListItem = State | Transition;
/**
 * Пока что это странный класс предназначенный только для отрисовки,
 * у {@link Container} и {@link Node} объявляется этот класс и рендер идёт по дереву
 * Плюс у переходов приоритет на отрисовку, в своём слое они всегда выше
 */
export class Children {
  private statesList = [] as string[];
  private transitionsList = [] as string[];

  constructor(public stateMachine: StateMachine) {}

  forEach(cb: (item: CbListItem) => void) {
    this.statesList.forEach((id) => {
      cb(this.stateMachine.states.get(id) as State);
    });

    this.transitionsList.forEach((id) => {
      cb(this.stateMachine.transitions.get(id) as Transition);
    });
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

    list.splice(index, 1);
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
}
