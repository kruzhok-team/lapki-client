import { CanvasScheme } from '@renderer/lib/CanvasScheme';
import { EventEmitter } from '@renderer/lib/common';
import { DrawableComponent, MarkedIconData, picto } from '@renderer/lib/drawable';
import { DrawableStateMachine } from '@renderer/lib/drawable/StateMachineNode';
import {
  ChangeComponentParams,
  DeleteComponentParams,
  DeleteStateMachineParams,
  Layer,
} from '@renderer/lib/types';
import { Point } from '@renderer/lib/types/graphics';
import {
  ChangeStateMachineParams,
  CreateComponentParams,
  CreateStateMachineParams,
} from '@renderer/lib/types/ModelTypes';
import { MyMouseEvent } from '@renderer/lib/types/mouse';

interface StateMachineEvents {
  change: DrawableStateMachine;
  mouseUpOnComponent: DrawableStateMachine;
  contextMenu: { component: DrawableStateMachine; position: Point };
}

/**
 * Контроллер {@link DrawableStateMachine|машин состояний}.
 * Обрабатывает события, связанные с ними.
 */
export class StateMachineController extends EventEmitter<StateMachineEvents> {
  items: Map<string, DrawableStateMachine> = new Map();

  constructor(private app: CanvasScheme) {
    super();
  }

  private get view() {
    return this.app.view;
  }

  private get controller() {
    return this.app.controller;
  }

  private get history() {
    return this.app.controller.history;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  createStateMachineFromObject(sm: DrawableStateMachine) {
    this.items.set(sm.id, sm);
    this.app.view.children.add(sm, Layer.Machines);
    this.app.view.isDirty = true;
  }

  createStateMachine(args: CreateStateMachineParams) {
    const markedSmIcon: MarkedIconData = {
      icon: 'stateMachine',
      label: 'Машина состояний',
    };
    const sm = new DrawableStateMachine(this.app, args.id, markedSmIcon);
    this.items.set(args.id, sm);
    this.app.view.children.add(sm, Layer.Machines);
    this.app.view.isDirty = true;
    return sm;
  }

  addComponent(smId: string, component: DrawableComponent) {
    const sm = this.getStateMachineById(smId);
    if (!sm) {
      return;
    }
    component.parent = sm;
    sm.children.add(component, Layer.Machines);

    this.view.isDirty = true;
  }

  deleteComponent(smId: string, componentId: string) {
    const sm = this.getStateMachineById(smId);
    if (!sm) {
      return;
    }
    const component = sm.children
      .getLayer(Layer.Components)
      .find((value) => value['id'] === componentId);
    if (!component) {
      throw Error('Попытка удалить несуществующий компонент!');
    }
    sm.children.remove(component, Layer.Components);
  }

  getStateMachineById(sm: string): DrawableStateMachine | undefined {
    const machineLayer = this.view.children.getLayer(Layer.Machines);
    return machineLayer.find((value) => value['id'] === sm) as DrawableStateMachine | undefined;
  }

  // changeStateMachine(args: ChangeStateMachineParams) {
  //   const component = this.items.get(args.id);
  //   if (!component) {
  //     throw new Error(`Изменение не существующей МС с идентификатором ${args.id}`);
  //   }
  // }

  deleteStateMachine(args: DeleteStateMachineParams, canUndo = true) {
    const sm = this.items.get(args.id);
    if (!sm) return;

    const numberOfConnectedActions = 0;

    if (canUndo) {
      this.history.do({
        type: 'deleteStateMachine',
        args: { args, prevStateMachine: structuredClone(sm) },
        numberOfConnectedActions,
      });
    }

    sm.children.clear();
    this.view.children.remove(sm, Layer.Machines);
    // this.unwatch(sm);
    this.items.delete(args.id);
    // this.app.controller.model.deleteMa(args.id);

    this.view.isDirty = true;
  }
}
