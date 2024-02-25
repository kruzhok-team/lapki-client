export type Point = { x: number; y: number };
export type Sizes = { width: number; height: number };
export type Rectangle = Point & Sizes;

export interface TransitionLine {
  start: Point;
  mid: Point | null;
  end: Point;
  se: number;
  ee: number;
}

export type HSector = 'center' | 'left' | 'right';
export type VSector = 'center' | 'top' | 'bottom';
