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
    sm.children.add(component, Layer.Machines);
  }

  getStateMachineById(sm: string): DrawableStateMachine | undefined {
    const machineLayer = this.view.children.getLayer(Layer.Machines);
    return machineLayer.find((value) => value['id'] === sm) as DrawableStateMachine | undefined;
  }

  changeStateMachine(args: ChangeStateMachineParams) {
    const component = this.items.get(args.id);
    if (!component) {
      throw new Error(`Изменение не существующей МС с идентификатором ${args.id}`);
    }
    // const sm = component.data;
    // componentData.parameters = args.parameters;
    // if (args.newName !== undefined) {
    //   // this.delete(args, false);
    //   // this.create({ ...componentData, name: args.newName });
    // } else {
    //   component.icon.label = args.parameters['label'];
    //   component.icon.color = args.parameters['labelColor'];
    // }
  }

  // changeComponentPosition(name: string, startPosition: Point, endPosition: Point, _canUndo = true) {
  //   const component = this.items.get(name);
  //   if (!component) return;
  //   if (_canUndo) {
  //     this.history.do({
  //       type: 'changeComponentPosition',
  //       args: { name, startPosition, endPosition },
  //     });
  //   }

  //   this.app.controller.model.changeComponentPosition(name, endPosition);

  //   this.view.isDirty = true;
  // }

  // deleteStateMachine(args: DeleteStateMachineParams, canUndo = true) {
  //   const sm = this.items.get(args.id);
  //   if (!sm) return;

  //   const numberOfConnectedActions = 0;

  //   if (canUndo) {
  //     this.history.do({
  //       type: 'deleteStateMachine',
  //       args: { ...args, prevStateMachine: structuredClone(sm) },
  //       numberOfConnectedActions,
  //     });
  //   }

  //   this.view.children.remove(component, Layer.Components);
  //   this.unwatch(component);
  //   this.items.delete(args.name);
  //   this.app.controller.model.deleteComponent(args.name);

  //   this.view.isDirty = true;
  // }

  // handleMouseUpOnComponent = (component: DrawableStateMachine) => {
  //   this.emit('mouseUpOnComponent', component);
  // };

  // handleMouseDown = (sm: DrawableStateMachine) => {
  //   this.controller.selectComponent(sm.id);
  // };

  // handleDoubleClick = (sm: DrawableStateMachine) => {
  //   this.emit('change', sm);
  // };

  // handleContextMenu = (component: DrawableStateMachine, e: { event: MyMouseEvent }) => {
  //   this.controller.selectComponent(component.id);

  //   this.emit('contextMenu', {
  //     component,
  //     position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
  //   });
  // };

  // handleDragEnd = (
  //   component: DrawableStateMachine,
  //   e: { dragStartPosition: Point; dragEndPosition: Point }
  // ) => {
  //   this.changeComponentPosition(component.id, e.dragStartPosition, e.dragEndPosition);
  // };

  // watch(component: DrawableStateMachine) {
  //   component.on('mousedown', this.handleMouseDown.bind(this, component));
  //   component.on('dblclick', this.handleDoubleClick.bind(this, component));
  //   component.on('mouseup', this.handleMouseUpOnComponent.bind(this, component));
  //   component.on('contextmenu', this.handleContextMenu.bind(this, component));
  //   component.on('dragend', this.handleDragEnd.bind(this, component));
  // }

  // unwatch(component: DrawableStateMachine) {
  //   component.off('mousedown', this.handleMouseDown.bind(this, component));
  //   component.off('dblclick', this.handleDoubleClick.bind(this, component));
  //   component.off('mouseup', this.handleMouseUpOnComponent.bind(this, component));
  //   component.off('contextmenu', this.handleContextMenu.bind(this, component));
  //   component.off('dragend', this.handleDragEnd.bind(this, component));
  // }
}
