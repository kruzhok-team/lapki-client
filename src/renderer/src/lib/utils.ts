export const isPointInRectangle = (
  rectangle: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  point: { x: number; y: number }
) =>
  rectangle.x <= point.x &&
  point.x <= rectangle.x + rectangle.width &&
  rectangle.y <= point.y &&
  point.y <= rectangle.y + rectangle.height;

export const isLineIntersection = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
) => {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x: x3, y: y3 } = p3;
  const { x: x4, y: y4 } = p4;

  const q = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  const a = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const b = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

  if (q === 0) {
    if (a === 0 && b === 0) {
      return true;
    }

    return false;
  }

  const ua = a / q;
  const ub = b / q;

  return 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1;
};

export const isRectanglesIntersection = (
  a: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  b: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
) => {
  const { x: x2, y: y2, width: w2, height: h2 } = b;

  const bPoints = [
    { x: x2, y: y2 },
    { x: x2 + w2, y: y2 },
    { x: x2 + w2, y: y2 + h2 },
    { x: x2, y: y2 + h2 },
  ] as { x: number; y: number }[];

  if (
    isPointInRectangle(a, bPoints[0]) ||
    isPointInRectangle(a, bPoints[1]) ||
    isPointInRectangle(a, bPoints[2]) ||
    isPointInRectangle(a, bPoints[3])
  ) {
    return true;
  }

  const { x: x1, y: y1, width: w1, height: h1 } = a;

  const aPoints = [
    { x: x1, y: y1 },
    { x: x1 + w1, y: y1 },
    { x: x1 + w1, y: y1 + h1 },
    { x: x1, y: y1 + h1 },
  ] as { x: number; y: number }[];

  if (
    isPointInRectangle(b, aPoints[0]) ||
    isPointInRectangle(b, aPoints[1]) ||
    isPointInRectangle(b, aPoints[2]) ||
    isPointInRectangle(b, aPoints[3])
  ) {
    return true;
  }

  if (
    isLineIntersection(aPoints[0], aPoints[1], bPoints[1], bPoints[2]) ||
    isLineIntersection(aPoints[0], aPoints[1], bPoints[0], bPoints[3]) ||
    isLineIntersection(aPoints[2], aPoints[3], bPoints[1], bPoints[2]) ||
    isLineIntersection(aPoints[2], aPoints[3], bPoints[0], bPoints[3])
  ) {
    return true;
  }

  if (
    isLineIntersection(aPoints[0], aPoints[3], bPoints[0], bPoints[1]) ||
    isLineIntersection(aPoints[0], aPoints[3], bPoints[2], bPoints[3]) ||
    isLineIntersection(aPoints[1], aPoints[2], bPoints[0], bPoints[1]) ||
    isLineIntersection(aPoints[1], aPoints[2], bPoints[2], bPoints[3])
  ) {
    return true;
  }

  return false;
};
