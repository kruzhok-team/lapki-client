import { Container } from '@renderer/lib/basic/Container';
import { Shape } from '@renderer/lib/drawable/Shape';

export abstract class BaseState extends Shape {
  constructor(container: Container, id: string, parent?: Shape) {
    super(container, id, parent);
  }
}
