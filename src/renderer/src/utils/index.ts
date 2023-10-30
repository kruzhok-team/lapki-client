import { Point } from '@renderer/types/graphics';

export const getVirtualElement = (position: Point) => {
  return {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        top: position.y,
        left: position.x,
        right: 0,
        bottom: 0,
      };
    },
  };
};

export const isDev = () => !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

export const indexOfMin = (arr: number[]) => {
  let min = Infinity;
  let minIndex = Infinity;

  arr.forEach((v, i) => {
    if (v < min) {
      min = v;
      minIndex = i;
    }
  });

  return minIndex;
};
