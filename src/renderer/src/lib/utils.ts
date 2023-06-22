import { Rectangle, Vector2D } from './types';

export const isPointInRectangle = (rectangle: Rectangle, point: Vector2D) => {
  return (
    rectangle.x <= point.x &&
    point.x <= rectangle.x + rectangle.width &&
    rectangle.y <= point.y &&
    point.y <= rectangle.y + rectangle.height
  );
};

export const rotatePoint = (point: Vector2D, origin: Vector2D, angle: number) => {
  const s = Math.sin(angle);
  const c = Math.cos(angle);

  // translate point back to origin:
  point.x -= origin.x;
  point.y -= origin.y;

  // rotate point
  const xNew = point.x * c - point.y * s;
  const yNew = point.x * s + point.y * c;

  // translate point back:
  point.x = xNew + origin.x;
  point.y = yNew + origin.y;

  return point;
};
