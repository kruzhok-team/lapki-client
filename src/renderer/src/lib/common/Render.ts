import { Observer } from './Observer';

type Subscriber = (data: Render) => void;

/**
 * Класс для подписки на событие отрисовки кадра анимации.
 */
export class Render extends Observer<Subscriber> {
  timestamp = 0;
  ptimestamp = 0;
  fps = 0;
  secondPart = 0;

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
