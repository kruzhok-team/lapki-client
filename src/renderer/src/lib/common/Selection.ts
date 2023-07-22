import { State } from '../drawable/State';
import { Container } from '../basic/Container';
import { Transition } from '../drawable/Transition';

type CreateStateCallback = (state) => void;

export class Selection {
  container!: Container;

  items: Map<string, State> = new Map();
  itemsTransition: Map<string, Transition> = new Map();

  constructor(container: Container) {
    this.container = container;
  }

  createCallback?: CreateStateCallback;

  onStateCreate = (callback: CreateStateCallback) => {
    this.createCallback = callback;
  };

  private removeSelection() {
    this.items.forEach((state) => state.setIsSelected(false));
    this.itemsTransition.forEach((value) => value.condition.setIsSelected(false));
    this.container.app.isDirty = true;
  }

  handleMouseUp = () => {
    this.removeSelection();
  };

  handleStateClick = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();

    this.removeSelection();

    target.setIsSelected(true);
    //Вывожу данные выделенного блока
    console.log(JSON.stringify(target));
  };

  handleStateDoubleClick = (e: { target: State; event: any }) => {
    e.event.stopPropagation();

    this.createCallback?.(e);
  };
}
