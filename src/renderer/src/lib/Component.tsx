import { Component as ComponentType } from '@renderer/types/diagram';

// TODO Удалить
export class Component {
  data!: ComponentType;

  constructor(data: ComponentType) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }
}
