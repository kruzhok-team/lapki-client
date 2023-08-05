import InitialIcon from '@renderer/assets/icons/initial state.svg';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { Rectangle } from '@renderer/types/graphics';

import { preloadImagesMap } from '../utils';
import { Action, Event } from '@renderer/types/diagram';

let imagesLoaded = false;

export const icons: Map<string, HTMLImageElement> = new Map();
// TODO? export const iconsPaths: Map<string, string> = new Map();

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

export type PictoProps = {
  leftIcon?: string;
  rightIcon: string;
  bgColor?: string;
  fgColor?: string;
  // TODO: args
};

/**
 * Отрисовщик пиктограмм.
 * Выполняет отрисовку пиктограмм с учётом масштаба.
 */
export class Picto {
  scale = 1;

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

  drawPicto(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    let leftIcon = ps.leftIcon;
    let rightIcon = ps.rightIcon;
    let bgColor = ps.bgColor ?? '#3a426b';
    let fgColor = ps.fgColor ?? '#fff';

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
}

/**
 * Глобальный экземпляр отрисовщика пиктограмм.
 */
export const picto = new Picto();
