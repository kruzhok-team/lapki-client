import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { DrawableComponent, MarkedIconData } from '@renderer/lib/drawable';
import { EditComponentParams, DeleteComponentParams, Layer } from '@renderer/lib/types';
import { Point } from '@renderer/lib/types/graphics';
import { CreateComponentParams } from '@renderer/lib/types/ModelTypes';
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

  private get history() {
    return this.app.controller.history;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  clearComponents() {
    this.items.clear();
  }

  createComponent(args: CreateComponentParams) {
    const icon = this.controller.platform?.getComponentIcon(args.type);
    if (!icon) {
      return;
    }
    const markedIcon: MarkedIconData = {
      icon: icon,
      label: args.parameters['label'],
      color: args.parameters['labelColor'],
    };
    const component = new DrawableComponent(this.app, args.name, args.position, markedIcon);
    this.items.set(args.name, component);
    this.watch(component);

    this.app.view.isDirty = true;

    return component;
  }

  changeComponent(args: EditComponentParams) {
    const component = this.items.get(args.name);
    if (!component) {
      throw new Error(`Изменение не существующего компонента с идентификатором ${args.name}`);
    }
    const componentData = component.data;
    componentData.parameters = args.parameters;
    if (args.newName !== undefined) {
      this.deleteComponent(args, false);
      // (L140-beep) скорее всего придется потом возиться с переходами
      // на схематехническом экране
      this.createComponent({ ...componentData, name: args.newName });
    } else {
      component.icon.label = args.parameters['label'];
      component.icon.color = args.parameters['labelColor'];
    }
  }

  changeComponentPosition(name: string, startPosition: Point, endPosition: Point, _canUndo = true) {
    const component = this.items.get(name);
    if (!component) return;
    if (_canUndo) {
      this.history.do({
        type: 'changeComponentPosition',
        args: { name, startPosition, endPosition },
      });
    }
    this.app.controller.model.changeComponentPosition(name, endPosition);

    this.view.isDirty = true;
  }

  deleteComponent(args: DeleteComponentParams, canUndo = true) {
    const component = this.items.get(args.name);
    if (!component) return;

    const numberOfConnectedActions = 0;

    // Удаляем зависимые переходы
    // this.controller.transitions.forEachByStateId(id, (transition) => {
    //   this.controller.transitions.deleteTransition(transition.id, canUndo);
    //   numberOfConnectedActions += 1;
    // });

    if (canUndo) {
      this.history.do({
        type: 'deleteComponent',
        args: { args, prevComponent: structuredClone(component.data) },
        numberOfConnectedActions,
      });
    }

    this.view.children.remove(component, Layer.Components);
    this.unwatch(component);
    this.items.delete(args.name);
    this.app.controller.model.deleteComponent(args.name);

    this.view.isDirty = true;
  }

  handleMouseUpOnComponent = (component: DrawableComponent) => {
    this.emit('mouseUpOnComponent', component);
  };

  handleMouseDown = (component: DrawableComponent) => {
    this.controller.selectComponent(component.id);
  };

  handleDoubleClick = (component: DrawableComponent) => {
    this.emit('change', component);
  };

  handleContextMenu = (component: DrawableComponent, e: { event: MyMouseEvent }) => {
    this.controller.selectComponent(component.id);

    this.emit('contextMenu', {
      component,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleDragEnd = (
    component: DrawableComponent,
    e: { dragStartPosition: Point; dragEndPosition: Point }
  ) => {
    this.changeComponentPosition(component.id, e.dragStartPosition, e.dragEndPosition);
  };

  watch(component: DrawableComponent) {
    component.on('mousedown', this.handleMouseDown.bind(this, component));
    component.on('dblclick', this.handleDoubleClick.bind(this, component));
    component.on('mouseup', this.handleMouseUpOnComponent.bind(this, component));
    component.on('contextmenu', this.handleContextMenu.bind(this, component));
    component.on('dragend', this.handleDragEnd.bind(this, component));
  }

  unwatch(component: DrawableComponent) {
    component.off('mousedown', this.handleMouseDown.bind(this, component));
    component.off('dblclick', this.handleDoubleClick.bind(this, component));
    component.off('mouseup', this.handleMouseUpOnComponent.bind(this, component));
    component.off('contextmenu', this.handleContextMenu.bind(this, component));
    component.off('dragend', this.handleDragEnd.bind(this, component));
  }
}
