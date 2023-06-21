import Observer from '../common/Observer.js';
import Curve from '../drawable/Curve.js';
import Drawable from '../drawable/Drawable.js';
import Frame from '../drawable/Frame.js';
import Group from '../drawable/Group.js';
import Point from '../drawable/Point.js';
import { ContainerMember, DrawableType } from '../types.js';

export type ContainerSerialise = {
  project: 'Figmo';
  address: 'https://github.com/Aleksey-Danchin/Figmo';
  offsetX: number;
  offsetY: number;
  items: ContainerMember[];
};

class Container extends Observer {
  $offsetX = 0;
  $offsetY = 0;

  $group = new Group();
  changed = false;

  items = new Set<Drawable>();

  add(...items: Drawable[]) {
    const size = this.items.size;

    for (const item of items) {
      if (item instanceof Drawable) {
        this.items.add(item);
      }
    }

    if (size !== this.items.size) {
      this.changed = true;
      this.dispatch();
    }
  }

  remove(...items: Drawable[]) {
    const size = this.items.size;

    for (const item of items) {
      this.items.delete(item);
    }

    if (size !== this.items.size) {
      this.changed = true;
      this.dispatch();
    }
  }

  convert(data: ContainerSerialise) {
    this.offsetX = data.offsetX;
    this.offsetY = data.offsetY;

    this.add(...Container.convert(data));
  }

  toJSON() {
    return Container.serialize(this);
  }

  get group() {
    if (this.changed) {
      this.changed = false;

      this.$group = new Group({
        offsetX: this.$offsetX,
        offsetY: this.$offsetY,
        items: Array.from(this.items),
      });
    }

    return this.$group;
  }

  get offsetX() {
    return this.$offsetX;
  }

  set offsetX(offsetX: number) {
    this.$offsetX = offsetX;
    this.changed = true;
  }

  get offsetY() {
    return this.$offsetY;
  }

  set offsetY(offsetY: number) {
    this.$offsetY = offsetY;
    this.changed = true;
  }

  static convert(data: ContainerSerialise) {
    return data.items.map((item) => {
      if (item.type === DrawableType.Curve) {
        const curve = new Curve();

        for (const { x, y } of item.points) {
          const point = new Point(x, y);
          curve.add(point);
        }

        return curve;
      }

      if (item.type === DrawableType.Frame) {
        const frame = new Frame({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        });

        return frame;
      }
    }) as Drawable[];
  }

  static serialize(container: Container, stringify = true) {
    const data = {
      project: 'Figmo',
      address: 'https://github.com/Aleksey-Danchin/Figmo',
      offsetX: container.offsetX,
      offsetY: container.offsetY,
      items: Array.from(container.items).map<ContainerMember>((item) => {
        if (item instanceof Curve) {
          return {
            type: DrawableType.Curve,
            points: Array.from(item.points).map(({ x, y }) => ({
              x,
              y,
            })),
          };
        }

        if (item instanceof Frame) {
          return {
            type: DrawableType.Frame,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          };
        }

        throw Error('Undefined type');
      }),
    } as ContainerSerialise;

    if (stringify) {
      return JSON.stringify(data);
    }

    return data;
  }
}

export default Container;
