export type Point = { x: number; y: number };

export type Rectangle = Point & { width: number; height: number };

export interface TransitionLine {
  start: Point;
  mid: Point | null;
  end: Point;
  se: number;
}

export type HSector = 'center' | 'left' | 'right';
export type VSector = 'center' | 'top' | 'bottom';
