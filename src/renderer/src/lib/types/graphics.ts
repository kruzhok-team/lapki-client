export type Point = { x: number; y: number };
export type Dimensions = { width: number; height: number };
export type Rectangle = Point & Dimensions;

export interface TransitionLine {
  start: Point;
  mid: Point | null;
  end: Point;
  se: number;
  ee: number;
}

export type HSector = 'center' | 'left' | 'right';
export type VSector = 'center' | 'top' | 'bottom';
