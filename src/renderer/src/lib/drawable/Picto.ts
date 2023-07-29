
import { preloadImages } from '../utils';
//Иконки событий
import onEnter from '@renderer/assets/icons/onEnter.svg';
import onExit from '@renderer/assets/icons/onExit.svg';
import DiodOn from '@renderer/assets/icons/DiodOn.svg';
import DiodOff from '@renderer/assets/icons/DiodOff.svg';

import InitialIcon from '@renderer/assets/icons/initial state.svg';
import { Rectangle } from '@renderer/types/graphics';

var imagesLoaded = false;

var icons: Map<string, HTMLImageElement> = new Map();

/**
 * Загрузка графических ресурсов для пиктограмм
 * 
 * @param callback Функция, выполняемая по загрузке всех иконок
 */
/* TODO: сейчас набор значков фиксирован, большее число здесь будет
          смотреться ужасно. Нужно переделать предзагрузку.
*/
export function preloadPicto(callback: () => void) {
  if (imagesLoaded) {
     callback();
     return;
  }
  preloadImages([
    onEnter, onExit, DiodOn, DiodOff, InitialIcon
  ]).then(([
    onEnter, onExit, DiodOn, DiodOff, initialIcon
  ]) => {
    icons.set("OnEnter", onEnter);
    icons.set("OnExit", onExit);
    icons.set("DiodOn", DiodOn);
    icons.set("DiodOff", DiodOff);
    icons.set("InitialIcon", initialIcon);
    callback();
  });
}

/**
 * Отрисовщик пиктограмм.
 * Выполняет отрисовку пиктограмм с учётом масштаба. 
 */
export class Picto {
  scale = 1;

  isResourcesReady() {
    return imagesLoaded;
  }

  drawIcon(ctx: CanvasRenderingContext2D, iconName: string, bounds: Rectangle) {
    if (!icons.has(iconName)) return;
    ctx.drawImage(
      icons.get(iconName)!,
      bounds.x,
      bounds.y,
      bounds.width / this.scale,
      bounds.height / this.scale
    );
  }

  // TODO: все перечисленные ниже функции нужно вернуть в законные места

  drawInitialMark(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x, y, 
      width: 25, 
      height: 25 
    }
    this.drawIcon(ctx, "InitialIcon", bounds);
  }

  drawOnEnter(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x, y, 
      width: 100, 
      height: 40 
    }
    this.drawIcon(ctx, "OnEnter", bounds);
  }

  drawOnExit(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x, y, 
      width: 100, 
      height: 40
    }
    this.drawIcon(ctx, "OnExit", bounds);
  }

  drawDiodOn(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x, y, 
      width: 100, 
      height: 40
    }
    this.drawIcon(ctx, "DiodOn", bounds);
  }

  drawDiodOff(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const bounds = {
      x, y, 
      width: 100, 
      height: 40
    }
    this.drawIcon(ctx, "DiodOff", bounds);
  }
}

/**
 * Глобальный экземпляр отрисовщика пиктограмм.
 */
export var picto = new Picto();