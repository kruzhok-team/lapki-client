import { Drawable, Children as IChildren, Layer } from '@renderer/lib/types';

/**
 * Пока что это странный класс предназначенный только для отрисовки,
 * у {@link Container} и {@link Shape} объявляется этот класс и рендер идёт по дереву
 * Плюс у переходов приоритет на отрисовку, в своём слое они всегда выше
 */
export class Children implements IChildren {
  layers = [] as Drawable[][];

  forEach(cb: (item: Drawable, layer: Layer) => void, layer?: Layer) {
    if (layer !== undefined) {
      return this.layers[layer].forEach((item) => {
        cb(item, layer as Layer);
      });
    }

    return this.layers.forEach((list, layer) => {
      list.forEach((item) => {
        cb(item, layer as Layer);
      });
    });
  }

  clear(layer?: Layer) {
    if (layer !== undefined) {
      this.layers[layer].length = 0;
      return;
    }

    this.layers.length = 0;
  }

  add(drawable: Drawable, layer: Layer) {
    if (!this.layers[layer]) {
      this.layers[layer] = [] as Drawable[];
    }

    this.layers[layer].push(drawable);
  }

  remove(drawable: Drawable, layer: Layer) {
    if (!this.layers[layer]) return;

    const index = this.layers[layer].findIndex((item) => item === drawable);

    if (index !== -1) {
      this.layers[layer].splice(index, 1);
    }
  }

  getLayer(layer: Layer) {
    return this.layers[layer] ?? [];
  }

  moveToTopOnLayer(drawable: Drawable) {
    const list = this.layers.find((layer) => layer?.includes(drawable));

    if (!list) return;

    const index = list.findIndex((item) => item === drawable);

    if (index === -1) return;

    list.splice(list.length - 1, 0, list.splice(index, 1)[0]);
  }

  getSize(layer?: Layer) {
    if (layer !== undefined) {
      return this.layers[layer]?.length ?? 0;
    }

    return this.layers.reduce((acc, cur) => acc + cur.length, 0);
  }

  get isEmpty() {
    return this.getSize() === 0;
  }
}
