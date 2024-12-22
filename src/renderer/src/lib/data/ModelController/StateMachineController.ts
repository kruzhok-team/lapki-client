import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { DrawableComponent, MarkedIconData } from '@renderer/lib/drawable';
import { DrawableStateMachine } from '@renderer/lib/drawable/StateMachineNode';
import { DeleteStateMachineParams, EditStateMachine, Layer } from '@renderer/lib/types';
import { Point } from '@renderer/lib/types/graphics';
import { CreateStateMachineParams } from '@renderer/lib/types/ModelTypes';

interface StateMachineEvents {
  change: DrawableStateMachine;
  mouseUpOnComponent: DrawableStateMachine;
  contextMenu: { component: DrawableStateMachine; position: Point };
}

/**
 * Контроллер {@link DrawableStateMachine|машин состояний}.
 * Обрабатывает события, связанные с ними.
  TODO(L140-beep): Доделать выделение, удаление через хоткеи
 */
export class StateMachineController extends EventEmitter<StateMachineEvents> {
  __items: Map<string, DrawableStateMachine> = new Map();

  constructor(private app: CanvasEditor) {
    super();
  }
  get items() {
    return this.__items;
  }
  private get view() {
    return this.app.view;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  createStateMachineFromObject = (sm: DrawableStateMachine) => {
    this.items.set(sm.id, sm);
    this.app.view.children.add(sm, Layer.Machines);
    this.app.view.isDirty = true;
  };

  createStateMachine = (args: CreateStateMachineParams) => {
    if (this.items.get(args.smId)) return;
    const markedSmIcon: MarkedIconData = {
      icon: 'stateMachine',
      label: args.name ?? args.smId,
    };
    const sm = new DrawableStateMachine(this.app, args.smId, markedSmIcon, args.position);
    this.watch(sm);
    this.items.set(args.smId, sm);
    this.view.children.add(sm, Layer.Machines);
    this.view.isDirty = true;
    return sm;
  };

  addComponent = (smId: string, component: DrawableComponent) => {
    const sm = this.getStateMachineById(smId);
    if (!sm) return;
    component.parent = sm;
    sm.children.add(component, Layer.Components);

    this.view.isDirty = true;
  };

  deleteComponent = (smId: string, componentId: string) => {
    const sm = this.getStateMachineById(smId);
    if (!sm) {
      return;
    }
    const component = sm.children
      .getLayer(Layer.Components)
      .find((value) => value['id'] === componentId);
    if (!component) {
      console.error('Попытка удалить несуществующий компонент!');
      return;
    }
    sm.children.remove(component, Layer.Components);

    this.view.isDirty = true;
  };

  getStateMachineById(sm: string): DrawableStateMachine | undefined {
    const machineLayer = this.view.children.getLayer(Layer.Machines);
    return machineLayer.find((value) => value['id'] === sm) as DrawableStateMachine | undefined;
  }

  editStateMachine = (args: EditStateMachine) => {
    const { id, name } = args;
    const item = this.items.get(id);
    if (!item) return;

    item.icon.label = name;
    this.view.isDirty = true;
  };

  changeStateMachinePosition(id: string, position: Point) {
    const item = this.items.get(id);
    if (!item) return;

    item.position = position;
    this.view.isDirty = true;
  }

  handleDragEnd = (
    sm: DrawableStateMachine,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeStateMachinePosition(sm.id, e.dragEndPosition);
    this.app.controller.emit('changeStateMachinePosition', {
      smId: sm.id,
      id: sm.id,
      endPosition: e.dragEndPosition,
    });
  };

  // handleMouseDown(sm: DrawableStateMachine) {
  //   const item = this.items.get(sm.id);
  //   if (!item) return;
  //   this.controller.emit('selectNote', { smId: note.smId, id: note.id });
  // }

  watch(sm: DrawableStateMachine) {
    // sm.on('mousedown', this.handleMouseDown.bind(this, sm));
    sm.on('dragend', this.handleDragEnd.bind(this, sm));
  }

  unwatch(sm: DrawableStateMachine) {
    sm.off('dragend', this.handleDragEnd.bind(this, sm));
  }

  deleteStateMachine = (args: DeleteStateMachineParams) => {
    const sm = this.items.get(args.id);
    if (!sm) return;

    // const numberOfConnectedActions = 0;

    // if (canUndo) {
    //   this.history.do({
    //     type: 'deleteStateMachine',
    //     args: { args, prevStateMachine: structuredClone(sm) },
    //     numberOfConnectedActions,
    //   });
    // }

    sm.children.clear();
    this.view.children.remove(sm, Layer.Machines);
    this.unwatch(sm);
    this.items.delete(args.id);

    this.view.isDirty = true;
  };
}
