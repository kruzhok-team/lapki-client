import { Platform } from '@renderer/types/platform';
import { icons, picto } from '../drawable/Picto';
import { Action, Event } from '@renderer/types/diagram';

export type ListEntry = {
  name: string;
  description?: string;
  img?: string;
};

export class PlatformManager {
  name!: string;
  data!: Platform;

  /**
   * Проекция названия компонента к его типу.
   * Если платформа не видит проекцию, она будет считать
   * переданное название типом компонента.
   */
  nameToComponent: Map<string, string> = new Map();

  componentToIcon: Map<string, string> = new Map();
  eventToIcon: Map<string, string> = new Map();
  actionToIcon: Map<string, string> = new Map();
  variableToIcon: Map<string, string> = new Map();

  constructor(name: string, platform: Platform) {
    this.name = name;
    this.data = platform;

    // TODO: забирать картинки из platform.variables
    for (const cId in platform.components) {
      const component = platform.components[cId];
      const cBase = cId + '/';
      // TODO: забирать картинки из component.variables
      if (component.img) {
        this.componentToIcon.set(cId, component.img);
      }
      for (const sId in component.signals) {
        const signal = component.signals[sId];
        if (signal.img) {
          this.eventToIcon.set(cBase + sId, signal.img);
        }
      }
      for (const mId in component.methods) {
        const method = component.methods[mId];
        if (method.img) {
          this.actionToIcon.set(cBase + mId, method.img);
        }
      }
      for (const vId in component.variables) {
        const variable = component.variables[vId];
        if (variable.img) {
          this.variableToIcon.set(cBase + vId, variable.img);
        }
      }
    }
  }

  resolveComponent(name: string): string {
    return this.nameToComponent.get(name) ?? name;
  }

  getAvailableEvents(name: string, isType?: boolean): ListEntry[] {
    const outs: ListEntry[] = [];
    const query = isType ? name : this.resolveComponent(name);
    const component = this.data.components[query];
    if (!component) return outs;
    const signals = component.signals;
    for (const eName in signals) {
      outs.push({
        name: eName,
        description: signals[eName].description,
        img: signals[eName].img,
      });
    }
    return outs;
  }

  getAvailableMethods(name: string, isType?: boolean): ListEntry[] {
    const outs: ListEntry[] = [];
    const query = isType ? name : this.resolveComponent(name);
    const component = this.data.components[query];
    if (!component) return outs;
    const methods = component.methods;
    for (const mName in methods) {
      outs.push({
        name: mName,
        description: methods[mName].description,
        img: methods[mName].img,
      });
    }
    return outs;
  }

  getComponentIcon(name: string, isName?: boolean) {
    const query = isName ? this.resolveComponent(name) : name;
    const icon = this.componentToIcon.get(query);
    // console.log(['getComponentIcon', name, isName, icon]);
    if (icon && icons.has(icon)) {
      return icon;
    } else {
      return 'unknown';
    }
  }

  getComponentIconUrl(name: string, isName?: boolean): string {
    const query = this.getComponentIcon(name, isName);
    // console.log(['getComponentIcon', name, isName, query, icons.get(query)!.src]);
    return icons.get(query)!.src;
  }

  getEventIcon(component: string, method: string) {
    const icon = this.eventToIcon.get(`${component}/${method}`);
    if (icon && icons.has(icon)) {
      return icon;
    } else {
      return 'unknown';
    }
  }

  getActionIcon(component: string, method: string) {
    const icon = this.actionToIcon.get(`${component}/${method}`);
    if (icon && icons.has(icon)) {
      return icon;
    } else {
      return 'unknown';
    }
  }

  getVariableIcon(component: string, variable: string) {
    const icon = this.variableToIcon.get(`${component}/${variable}`);
    if (icon && icons.has(icon)) {
      return icon;
    } else {
      return 'variable';
    }
  }

  drawEvent(ctx: CanvasRenderingContext2D, ev: Event, x: number, y: number) {
    let leftIcon: string | undefined = undefined;
    let rightIcon = 'unknown';
    let bgColor = '#3a426b';
    let fgColor = '#fff';

    if (ev.component === 'System') {
      // ev.method === 'onEnter' || ev.method === 'onExit'
      rightIcon = ev.method;
    } else {
      const component = this.resolveComponent(ev.component);
      leftIcon = this.getComponentIcon(component);
      rightIcon = this.getEventIcon(component, ev.method);
    }

    picto.drawPicto(ctx, x, y, {
      bgColor,
      fgColor,
      leftIcon,
      rightIcon,
    });
  }

  drawAction(ctx: CanvasRenderingContext2D, ac: Action, x: number, y: number) {
    let leftIcon: string | undefined = undefined;
    let rightIcon = 'unknown';
    let bgColor = '#5b5f73';
    let fgColor = '#fff';

    if (ac.component === 'System') {
      rightIcon = ac.method;
    } else {
      const component = this.resolveComponent(ac.component);
      leftIcon = this.getComponentIcon(component);
      rightIcon = this.getActionIcon(component, ac.method);
    }

    picto.drawPicto(ctx, x, y, {
      bgColor,
      fgColor,
      leftIcon,
      rightIcon,
    });
  }
}

/*
@privateRemarks

Менеджер платформы: 
выдача списка компонентов
синглтон ли компонент?
выдача списка событий для компонента
выдача списка действий для компонента
выдача списка параметров для компонента
выдача списка переменных для компонента

Привязать Picto для отрисовки значков

*/
