
import { preloadImages } from '../utils';
//Иконки событий
import onEnter from '@renderer/assets/icons/onEnter.svg';
import onExit from '@renderer/assets/icons/onExit.svg';
import DiodOn from '@renderer/assets/icons/DiodOn.svg';
import DiodOff from '@renderer/assets/icons/DiodOff.svg';

var icoOnEnter!: HTMLImageElement;
var icoOnExit!: HTMLImageElement;
var icoDiodOn!: HTMLImageElement;
var icoDiodOff!: HTMLImageElement;

preloadImages([onEnter, onExit, DiodOn, DiodOff]).then(([onEnter, onExit, DiodOn, DiodOff]) => {
  icoOnEnter = onEnter;
  icoOnExit = onExit;
  icoDiodOn = DiodOn;
  icoDiodOff = DiodOff;
});

export class Picto {
  scale = 1;

  isResourcesReady() {
    return (icoOnEnter && icoOnExit && icoDiodOn && icoDiodOff)
  }

  drawOnEnter(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.drawImage(
      icoOnEnter,
      x,
      y,
      100 / this.scale,
      40 / this.scale
    );
  }

  drawOnExit(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.drawImage(
      icoOnExit,
      x,
      y,
      100 / this.scale,
      40 / this.scale
    );
  }

  drawDiodOn(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.drawImage(
      icoDiodOn,
      x,
      y,
      100 / this.scale,
      40 / this.scale
    );
  }

  drawDiodOff(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.drawImage(
      icoDiodOff,
      x,
      y,
      100 / this.scale,
      40 / this.scale
    );
  }
}

export var picto = new Picto();