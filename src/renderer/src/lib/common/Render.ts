import { Observer } from './Observer';

type Subscriber = (data: Render) => void;

/**
 * Класс для подписки на событие отрисовки кадра анимации.
 */
export class Render extends Observer<Subscriber> {
  timestamp: number = 0;
  ptimestamp: number = 0;
  fps: number = 0;
  secondPart: number = 0;

  constructor() {
    super();

    requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  tick(_timestamp: number) {
    requestAnimationFrame((timestamp) => this.tick(timestamp));

    // TODO: задействовать элементы этого класса
    // Object.assign(this, {
    //   timestamp,
    //   ptimestamp: this.timestamp,
    //   fps: 1000 / (timestamp - this.ptimestamp),
    //   secondPart: (timestamp - this.ptimestamp) / 1000,
    // });

    this.dispatch(this);
  }
}
