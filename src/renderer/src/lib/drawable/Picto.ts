import InitialIcon from '@renderer/assets/icons/initial state.svg';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import EdgeHandle from '@renderer/assets/icons/new transition.svg';
import { Rectangle } from '@renderer/types/graphics';

import { preloadImagesMap } from '../utils';

let imagesLoaded = false;

export const icons: Map<string, HTMLImageElement> = new Map();
// TODO? export const iconsPaths: Map<string, string> = new Map();

const basePicto = {
  EdgeHandle: EdgeHandle,
  InitialIcon: InitialIcon,
  unknown: UnknownIcon,
  system: '/img/arduino/action.svg',
  variable: '/img/arduino/variable-type.svg',

  'op/notEquals': '/img/bearloga/compare_not_equal.svg',
  'op/equals': '/img/bearloga/compare_equal.svg',
  'op/greater': '/img/bearloga/compare_more.svg',
  'op/less': '/img/bearloga/compare_less.svg',
  'op/greaterOrEqual': '/img/bearloga/compare_more_eq.svg',
  'op/lessOrEqual': '/img/bearloga/compare_less_eq.svg',
  // "op/or": "/img/common/compare_or.svg",
  // "op/and": "/img/common/compare_and.svg",

  onEnter: '/img/bearloga/event_enter.svg',
  onExit: '/img/bearloga/event_exit.svg',
};

export function extendPreloadPicto(addition: { [path: string]: string }) {
  for (const key in addition) {
    basePicto[key] = addition[key];
  }
}

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
  opacity?: number;
  parameter?: string;
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
  eventMargin = 5;
  iconSize = 30;
  separatorVOffset = 4;
  iconVOffset = 5;
  iconHOffset = 10;
  pxPerChar = 15;
  textPadding = 5;

  drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    bgColor?: string,
    fgColor?: string,
    opacity?: number
  ) {
    ctx.save();
    ctx.fillStyle = bgColor ?? '#3a426b';
    ctx.strokeStyle = fgColor ?? '#fff';
    ctx.globalAlpha = opacity ?? 1.0;
    ctx.lineWidth = 0.5;
    ctx.roundRect(x, y, width / this.scale, height / this.scale, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bgColor?: string,
    fgColor?: string,
    opacity?: number
  ) {
    this.drawRect(ctx, x, y, this.eventWidth, this.eventHeight, bgColor, fgColor, opacity);
  }

  drawCursor(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // FIXME: рисовать лучше под иконкой, рисует фон, даже если не просишь
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = 'none';
    ctx.lineWidth = 3 / this.scale;
    ctx.roundRect(x, y, this.eventWidth / this.scale, this.eventHeight / this.scale, 5);
    ctx.stroke();
  }

  drawMono(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    let rightIcon = ps.rightIcon;
    let bgColor = ps.bgColor ?? '#3a426b';
    let fgColor = ps.fgColor ?? '#fff';
    let opacity = ps.opacity ?? 1.0;

    // Рамка
    this.drawRect(ctx, x, y, this.eventHeight, this.eventHeight, bgColor, fgColor, opacity);

    if (!rightIcon) return;

    this.drawImage(ctx, rightIcon, {
      x: x + (this.eventHeight - this.iconSize) / 2 / this.scale,
      y: y + this.iconVOffset / this.scale,
      width: this.iconSize,
      height: this.iconSize,
    });
  }

  drawText(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    let text = ps.rightIcon;
    let bgColor = ps.bgColor ?? '#3a426b';
    let fgColor = ps.fgColor ?? '#fff';
    let opacity = ps.opacity ?? 1.0;

    const baseFontSize = 24;
    const w = this.textPadding * 2 + text.length * this.pxPerChar;
    const cy = (picto.eventHeight - baseFontSize) / this.scale;

    // Рамка
    this.drawRect(ctx, x, y, w, this.eventHeight, bgColor, fgColor, opacity);

    const fontSize = baseFontSize / picto.scale;
    ctx.save();
    ctx.font = `${fontSize}px/0 monospace`;
    ctx.fillStyle = fgColor;
    ctx.strokeStyle = fgColor;
    ctx.textBaseline = 'hanging';

    const p = 5 / picto.scale;
    ctx.fillText(text, x + p, y + cy - p);

    ctx.restore();
  }

  drawPicto(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    let leftIcon = ps.leftIcon;
    let rightIcon = ps.rightIcon;
    let bgColor = ps.bgColor ?? '#3a426b';
    let fgColor = ps.fgColor ?? '#fff';
    let opacity = ps.opacity ?? 1.0;

    // Рамка
    this.drawBorder(ctx, x, y, bgColor, fgColor, opacity);

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
    if (ps.parameter) {
      const baseFontSize = 12;
      const cy = (picto.eventHeight - baseFontSize) / this.scale;
      const cx = (this.eventWidth - 5) / this.scale;
      const fontSize = baseFontSize / picto.scale;
      ctx.save();
      ctx.font = `${fontSize}px/0 monospace`;
      ctx.fillStyle = fgColor;
      ctx.strokeStyle = bgColor;
      ctx.textBaseline = 'hanging';
      ctx.textAlign = 'end';
      ctx.lineWidth = 0.5 / this.scale;

      ctx.strokeText(ps.parameter, x + cx, y + cy);
      ctx.fillText(ps.parameter, x + cx, y + cy);

      ctx.restore();
    }
  }
}

/**
 * Глобальный экземпляр отрисовщика пиктограмм.
 */
export const picto = new Picto();
