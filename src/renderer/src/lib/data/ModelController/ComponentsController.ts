import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { DrawableComponent, MarkedIconData } from '@renderer/lib/drawable';
import {
  ChangeSelectionParams,
  EditComponentParams,
  Layer,
  RenameComponentParams,
} from '@renderer/lib/types';
import { Point } from '@renderer/lib/types/graphics';
import {
  ChangePosition,
  CreateComponentParams,
  DeleteDrawableParams,
} from '@renderer/lib/types/ModelTypes';
import { MyMouseEvent } from '@renderer/lib/types/mouse';

interface ComponentsControllerEvents {
  change: DrawableComponent;
  mouseUpOnComponent: DrawableComponent;
  contextMenu: { component: DrawableComponent; position: Point };
}

/**
 * Контроллер {@link DrawableComponent|компонентов}.
 * Обрабатывает события, связанные с ними.
 */
export class ComponentsController extends EventEmitter<ComponentsControllerEvents> {
  items: Map<string, DrawableComponent> = new Map();

  constructor(private app: CanvasEditor) {
    super();
  }

  private get view() {
    return this.app.view;
  }

  private get controller() {
    return this.app.controller;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  clearComponents() {
    this.items.clear();
  }

  getComponentKey(smId: string, componentName: string) {
    return `${smId}::${componentName}`;
  }

  createComponent = (args: CreateComponentParams) => {
    const key = this.getComponentKey(args.smId, args.id);
    if (this.items.get(key)) return;
    const platform = this.controller.platform[args.smId];
    if (!platform) return;
    const icon = platform.getComponentIcon(args.type);
    if (!icon) return;
    const markedIcon: MarkedIconData = {
      icon: icon,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    };
    const component = new DrawableComponent(
      this.app,
      args.id,
      args.smId,
      args.position,
      markedIcon
    );
    this.items.set(key, component);
    this.watch(component);

    this.app.view.isDirty = true;

    return component;
  };

  changeComponentSelection = (args: ChangeSelectionParams) => {
    const key = this.getComponentKey(args.smId, args.id);
    const component = this.items.get(key);
    if (!component) return;

    component.setIsSelected(args.value);
  };

  editComponent = (args: EditComponentParams) => {
    const key = this.getComponentKey(args.smId, args.id);
    const component = this.items.get(key);
    if (!component) return;
    // const componentData = component.data;
    if (args.newId !== undefined) {
      this.controller.deleteComponent(args);
      // (L140-beep) скорее всего придется потом возиться с переходами
      // на схематехническом экране
      this.controller.createComponent({
        smId: args.smId,
        type: args.type,
        name: args.name,
        id: args.newId,
        position: component.position,
        parameters: args.parameters,
        order: 0,
      });
    } else {
      component.icon.label = args.parameters['label'];
      component.icon.color = args.parameters['labelColor'];
    }

    return component;
  };

  renameComponent(args: RenameComponentParams) {
    const key = this.getComponentKey(args.smId, args.id);
    const component = this.items.get(key);
    if (!component) return;
    this.controller.deleteComponent(args);
    // (L140-beep) скорее всего придется потом возиться с переходами
    // на схематехническом экране
    this.controller.createComponent({
      smId: args.smId,
      type: args.type,
      name: args.name,
      id: args.newId,
      position: component.position,
      parameters: args.parameters,
      order: 0,
    });
  }

  changeComponentPosition = (args: ChangePosition) => {
    const { endPosition } = args;
    const key = this.getComponentKey(args.smId, args.id);
    const component = this.items.get(key);
    if (!component) return;
    component.position = endPosition;
    this.view.isDirty = true;
  };

  deleteComponent = (args: DeleteDrawableParams) => {
    const key = this.getComponentKey(args.smId, args.id);
    const component = this.items.get(key);
    if (!component) return;

    // const numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    // this.controller.transitions.forEachByStateId(id, (transition) => {
    //   this.controller.transitions.deleteTransition(transition.id, canUndo);
    //   numberOfConnectedActions += 1;
    // });

    // if (canUndo) {
    //   this.history.do({
    //     type: 'deleteComponent',
    //     args: { args, prevComponent: structuredClone(component.data) },
    //     numberOfConnectedActions,
    //   });
    // }

    this.view.children.remove(component, Layer.Components);
    this.unwatch(component);
    this.items.delete(key);

    this.view.isDirty = true;
  };

  handleMouseUpOnComponent = (component: DrawableComponent) => {
    this.emit('mouseUpOnComponent', component);
  };

  handleMouseDown = (component: DrawableComponent) => {
    this.controller.selectComponent({ smId: component.smId, id: component.id });
  };

  // handleDoubleClick = (component: DrawableComponent) => {
  //   // this.emit('change', component);
  // };

  handleContextMenu = (component: DrawableComponent, e: { event: MyMouseEvent }) => {
    this.controller.selectComponent({ smId: component.smId, id: component.id });

    this.emit('contextMenu', {
      component,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleDragEnd = (
    component: DrawableComponent,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeComponentPosition({
      smId: component.smId,
      id: component.id,
      endPosition: e.dragEndPosition,
    });
    this.app.controller.emit('changeComponentPosition', {
      smId: component.smId,
      id: component.id,
      startPosition: e.dragStartPosition,
      endPosition: e.dragEndPosition,
    });
  };

  watch(component: DrawableComponent) {
    component.on('mousedown', this.handleMouseDown.bind(this, component));
    // component.on('dblclick', this.handleDoubleClick.bind(this, component));
    component.on('mouseup', this.handleMouseUpOnComponent.bind(this, component));
    component.on('contextmenu', this.handleContextMenu.bind(this, component));
    component.on('dragend', this.handleDragEnd.bind(this, component));
  }

  unwatch(component: DrawableComponent) {
    component.off('mousedown', this.handleMouseDown.bind(this, component));
    // component.off('dblclick', this.handleDoubleClick.bind(this, component));
    component.off('mouseup', this.handleMouseUpOnComponent.bind(this, component));
    component.off('contextmenu', this.handleContextMenu.bind(this, component));
    component.off('dragend', this.handleDragEnd.bind(this, component));
  }
}
