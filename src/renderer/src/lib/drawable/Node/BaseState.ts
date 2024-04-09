import { Container } from '@renderer/lib/basic/Container';
import { Shape } from '@renderer/lib/drawable/Shape';
import { IState } from '@renderer/types/diagram';

export abstract class BaseState extends Shape {
  constructor(container: Container, id: string, parent?: Shape) {
    super(container, id, parent);
  }

  abstract get data(): IState;

  abstract draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement): void;
}
