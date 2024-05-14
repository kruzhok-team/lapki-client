import { Point } from '../types';

export const roundPoint = (point: Point, fractionDigits: number = 3) => {
  return {
    x: Number(point.x.toFixed(fractionDigits)),
    y: Number(point.y.toFixed(fractionDigits)),
  };
};
