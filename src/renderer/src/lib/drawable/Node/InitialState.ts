import { Container } from '@renderer/lib/basic/Container';
import { BaseState } from '@renderer/lib/drawable/Node/BaseState';
// import { transitionStyle } from '@renderer/lib/styles';
// import {
//   degrees_to_radians,
//   drawCircle,
//   drawCurvedLine,
//   drawTriangle,
//   getLine,
// } from '@renderer/lib/utils';
import { Shape } from '@renderer/lib/drawable/Shape';
import { drawText } from '@renderer/lib/utils/text';
import { getColor } from '@renderer/theme';
import { IInitialStateNew } from '@renderer/types/diagram';

/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorManager, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class InitialState extends BaseState {
  constructor(container: Container, id: string, parent?: Shape) {
    super(container, id, parent);
  }

  get data() {
    return this.container.app.manager.data.elements.states[this.id] as IInitialStateNew;
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }
  get dimensions() {
    return this.data.dimensions;
  }
  set dimensions(value) {
    this.data.dimensions = value;
  }

  // get target() {
  //   return this.container.machineController.states.get(this.data!.target) ?? null;
  // }

  draw(ctx: CanvasRenderingContext2D) {
    // if (!this.target) return;

    const { x, y, width, height } = this.drawBounds;
    const fontSize = 24 / this.container.app.manager.data.scale;

    ctx.fillStyle = getColor('primary');

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6 / this.container.app.manager.data.scale);
    ctx.fill();

    drawText(ctx, 'Начало', {
      x: x + width / 2,
      y: y + height / 2,
      font: `bold ${fontSize}px/1 "Fira Sans"`,
      color: '#FFF',
      textAlign: 'center',
      textBaseline: 'middle',
    });

    // const line = getLine(this.target.drawBounds, this.drawBounds, 10, 3, 3);

    // const rounded = 12 / this.container.app.manager.data.scale; // нет защиты на максимальный радиус, так что просто его не ставь!
    // ctx.strokeStyle = getColor('text-primary');
    // ctx.fillStyle = getColor('text-primary');

    // drawCurvedLine(ctx, line, rounded);
    // drawCircle(ctx, line.end, transitionStyle.startSize / this.container.app.manager.data.scale);
    // drawTriangle(
    //   ctx,
    //   line.start,
    //   10 / this.container.app.manager.data.scale,
    //   degrees_to_radians(line.se)
    // );

    ctx.closePath();
  }
}
