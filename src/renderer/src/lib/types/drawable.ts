import { Point } from './graphics';

export interface GetCapturedNodeParams {
  position: Point;
  layer?: Layer;
  exclude?: Drawable[];
  includeChildrenHeight?: boolean;
}

export enum Layer {
  States,
  InitialStates,
  FinalStates,
  Transitions,
  Notes,
}

export interface Drawable {
  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void;
  children?: Children;
}

export interface Children {
  forEach(cb: (item: Drawable, layer: Layer) => void): void;
  add(drawable: Drawable, layer: Layer): void;
}
