import { Component as ComponentType } from '@renderer/types/diagram';

import { icons } from './drawable/Picto';

export class Component {
  data!: ComponentType;
  image: HTMLImageElement;

  constructor(data: ComponentType) {
    this.data = data;
    // this.image = icons[this.data.type];
    this.image = icons.get('LED')!;
  }

  toJSON() {
    return this.data;
  }
}
