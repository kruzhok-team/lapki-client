import { Platform } from '@renderer/types/platform';
import { icons, picto } from '../drawable/Picto';
import { Action, Event } from '@renderer/types/diagram';

export class PlatformManager {
  platform: Platform;

  componentToIcon: Map<string, string> = new Map();
  actionToIcon: Map<string, string> = new Map();
  nameToIcon: Map<string, string> = new Map();

  constructor(platform: Platform) {
    this.platform = platform;
  }

  getComponentIcon(name: string) {
    // FIXME: учесть тип компонента и платформу!
    if (icons.has(name)) {
      return name;
    } else {
      return 'unknown';
    }
  }

  getEventIcon(component: string, method: string) {
    // FIXME: учесть тип компонента и платформу!
    const name = `${component}/${method}`;
    if (icons.has(name)) {
      return name;
    } else {
      return 'unknown';
    }
  }

  getActionIcon(component: string, method: string) {
    // FIXME: учесть тип компонента и платформу!
    const name = `${component}/${method}`;
    if (icons.has(name)) {
      return name;
    } else {
      return 'unknown';
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
      leftIcon = this.getComponentIcon(ev.component);
      rightIcon = this.getEventIcon(ev.component, ev.method);
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
      leftIcon = this.getComponentIcon(ac.component);
      rightIcon = this.getActionIcon(ac.component, ac.method);
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
