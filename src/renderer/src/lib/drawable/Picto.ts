import InitialIcon from '@renderer/assets/icons/initial state.svg';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { Rectangle } from '@renderer/types/graphics';

import { preloadImagesMap } from '../utils';
import { Action, Event } from '@renderer/types/diagram';

let imagesLoaded = false;

export const icons: Map<string, HTMLImageElement> = new Map();

/* TODO: сейчас набор значков фиксирован, большее число здесь будет
          смотреться ужасно. Нужно переделать предзагрузку.
*/
const basePicto = {
  InitialIcon: InitialIcon,
  unknown: UnknownIcon,

  onEnter: '/img/bearloga/event_enter.svg',
  onExit: '/img/bearloga/event_exit.svg',
  'bearloga/sensor': '/img/bearloga/sensor.svg',
  Button: '/img/bearloga/health.svg',
  'Button/isJustPressed': '/img/bearloga/explode.svg',
  LED: '/img/bearloga/ability_done.svg',
  'LED/on': '/img/bearloga/ability_available.svg',
  'LED/off': '/img/bearloga/activate.svg',
};

/**
 * Загрузка графических ресурсов для пиктограмм
 *
 * @param callback Функция, выполняемая по загрузке всех иконок
 */
export function preloadPicto(callback: () => void) {
  if (imagesLoaded) {
    callback();
    return;
  }
  preloadImagesMap(icons, basePicto).then(() => {
    imagesLoaded = true;
    callback();
  });
}

/**
 * Отрисовщик пиктограмм.
 * Выполняет отрисовку пиктограмм с учётом масштаба.
 */
export class Picto {
  scale = 1;

  componentToIcon: Map<string, string> = new Map();
  actionToIcon: Map<string, string> = new Map();
  nameToIcon: Map<string, string> = new Map();

  isResourcesReady() {
    return imagesLoaded;
  }

  drawImage(ctx: CanvasRenderingContext2D, iconName: string, bounds: Rectangle) {
    // console.log([iconName, icons.has(iconName)]);
    if (!icons.has(iconName)) return;
    ctx.beginPath();
    ctx.drawImage(
      icons.get(iconName)!,
      bounds.x,
      bounds.y,
      bounds.width / this.scale,
      bounds.height / this.scale
    );
    ctx.closePath();
  }

  // TODO: все перечисленные ниже функции нужно вернуть в законные места

  eventWidth = 100;
  eventHeight = 40;
  iconSize = 30;
  separatorVOffset = 4;
  iconVOffset = 5;
  iconHOffset = 10;

  drawBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bgColor?: string,
    fgColor?: string
  ) {
    ctx.fillStyle = bgColor ?? '#3a426b';
    ctx.strokeStyle = fgColor ?? '#fff';
    ctx.lineWidth = 0.5;
    ctx.roundRect(x, y, this.eventWidth / this.scale, this.eventHeight / this.scale, 5);
    ctx.fill();
    ctx.stroke();
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
    let leftIcon: string | null = null;
    let rightIcon: string | null = null;
    let bgColor = '#3a426b';
    let fgColor = '#fff';

    if (ev.component === 'System') {
      // ev.method === 'onEnter' || ev.method === 'onExit'
      rightIcon = ev.method;
    } else {
      leftIcon = this.getComponentIcon(ev.component);
      rightIcon = this.getEventIcon(ev.component, ev.method);
    }

    // Рамка
    this.drawBorder(ctx, x, y, bgColor, fgColor);

    if (!rightIcon) return;
    if (!leftIcon) {
      // single icon mode
      this.drawImage(ctx, rightIcon, {
        x: x + (this.eventWidth - this.iconSize) / 2 / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });
    } else {
      // double icon mode
      this.drawImage(ctx, leftIcon, {
        x: x + this.iconHOffset / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });

      ctx.strokeStyle = fgColor;
      ctx.lineWidth = 1;
      ctx.moveTo(x + this.eventWidth / 2 / this.scale, y + this.separatorVOffset / this.scale);
      ctx.lineTo(
        x + this.eventWidth / 2 / this.scale,
        y + (this.eventHeight - this.separatorVOffset) / this.scale
      );
      ctx.stroke();

      this.drawImage(ctx, rightIcon, {
        x: x + (this.eventWidth - this.iconSize - this.iconHOffset) / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });
    }
  }

  drawAction(ctx: CanvasRenderingContext2D, ac: Action, x: number, y: number) {
    let leftIcon: string | null = null;
    let rightIcon: string | null = null;
    let bgColor = '#5b5f73';
    let fgColor = '#fff';

    if (ac.component === 'System') {
      rightIcon = ac.method;
    } else {
      leftIcon = this.getComponentIcon(ac.component);
      rightIcon = this.getActionIcon(ac.component, ac.method);
    }

    // Рамка
    this.drawBorder(ctx, x, y, bgColor, fgColor);

    if (!rightIcon) return;
    if (!leftIcon) {
      // single icon mode
      this.drawImage(ctx, rightIcon, {
        x: x + (this.eventWidth - this.iconSize) / 2 / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });
    } else {
      // double icon mode
      this.drawImage(ctx, leftIcon, {
        x: x + this.iconHOffset / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });

      ctx.strokeStyle = fgColor;
      ctx.lineWidth = 1;
      ctx.moveTo(x + this.eventWidth / 2 / this.scale, y + this.separatorVOffset / this.scale);
      ctx.lineTo(
        x + this.eventWidth / 2 / this.scale,
        y + (this.eventHeight - this.separatorVOffset) / this.scale
      );
      ctx.stroke();

      this.drawImage(ctx, rightIcon, {
        x: x + (this.eventWidth - this.iconSize - this.iconHOffset) / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });
    }
  }

  drawDiodOn(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x,
      y,
      width: 100,
      height: 40,
    };
    this.drawImage(ctx, 'DiodOn', bounds);
  }

  drawDiodOff(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x,
      y,
      width: 100,
      height: 40,
    };
    this.drawImage(ctx, 'DiodOff', bounds);
  }
}

/**
 * Глобальный экземпляр отрисовщика пиктограмм.
 */
export const picto = new Picto();
