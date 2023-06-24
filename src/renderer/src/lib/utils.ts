import { Rectangle, Point } from '@renderer/types/graphics';

export const isPointInRectangle = (rectangle: Rectangle, point: Point) => {
  return (
    rectangle.x <= point.x &&
    point.x <= rectangle.x + rectangle.width &&
    rectangle.y <= point.y &&
    point.y <= rectangle.y + rectangle.height
  );
};

export const rotatePoint = (point: Point, origin: Point, angle: number) => {
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

export const getDistanceBetweenPoints = (p1: Point, p2: Point) => {
  return (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
};

export const getRectangleCenter = (rect: Rectangle): Point => {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
};

export const getDistanceBetweenRectangles = (rect1: Rectangle, rect2: Rectangle) => {
  const c1 = getRectangleCenter(rect1);
  const c2 = getRectangleCenter(rect2);

  return getDistanceBetweenPoints(c1, c2);
};

interface TransitionLines {
  start: Point;
  mid: Point | null;
  end: Point;
  ae: number;
}

export const getTransitionLines = (state1: Rectangle, state2: Rectangle, condition: Rectangle) => {
  // const d1 = getDistanceBetweenRectangles(state1, condition);
  // const d2 = getDistanceBetweenRectangles(state2, condition);

  // let minDState: Rectangle;
  // let maxDState: Rectangle;

  // if (d1 <= d2) {
  //   minDState = state1;
  //   maxDState = state2;
  // } else {
  //   minDState = state2;
  //   maxDState = state1;
  // }

  const conditionXCenter = condition.x + condition.width / 2;
  const conditionYCenter = condition.y + condition.height / 2;

  // const condTopPoint = { x: condition.x + condition.width / 2, y: condition.y };
  // const condBottomPoint = {
  //   x: condition.x + condition.width / 2,
  //   y: condition.y + condition.height,
  // };
  // const condLeftPoint = { x: condition.x, y: condition.y + condition.height / 2 };
  // const condRightPoint = {
  //   x: condition.x + condition.width,
  //   y: condition.y + condition.height / 2,
  // };

  const padding = 10;
  type XSector = 'center' | 'left' | 'right';
  type YSector = 'center' | 'top' | 'bottom';
  let s1SectorX: XSector = 'center';
  let s1SectorY: YSector = 'center';

  if (conditionXCenter > state1.x + state1.width - padding) {
    s1SectorX = 'left';
  } else if (conditionXCenter < state1.x + padding) {
    s1SectorX = 'right';
  }

  if (conditionYCenter > state1.y + state1.height - padding) {
    s1SectorY = 'top';
  } else if (conditionYCenter < state1.y + padding) {
    s1SectorY = 'bottom';
  }

  const result: TransitionLines = {
    start: {
      x: 0,
      y: 0,
    },
    mid: null,
    end: {
      x: 0,
      y: 0,
    },
    ae: 0,
  };

  if (s1SectorY === 'center') {
    result.start.x = s1SectorX === 'left' ? state1.x + state1.width : state1.x;
    result.start.y = conditionYCenter;
    result.end.x = s1SectorX === 'left' ? condition.x : condition.x + condition.width;
    result.end.y = result.start.y;

    result.ae = s1SectorX === 'left' ? 180 : 0;

    return result;
  }

  if (s1SectorX === 'center') {
    result.start.x = conditionXCenter;
    result.start.y = s1SectorY === 'top' ? state1.y + state1.height : state1.y;
    result.end.x = result.start.x;
    result.end.y = s1SectorY === 'top' ? condition.y : condition.y + condition.height;

    result.ae = s1SectorY === 'top' ? 180 : 0;

    return result;
  }

  if (s1SectorY === 'top') {
    result.start.y = state1.y + state1.height - padding;
    result.end.x = conditionXCenter;
    result.end.y = condition.y;

    if (s1SectorX === 'left') {
      result.start.x = state1.x + state1.width;

      if (result.end.x < state1.x + state1.width + padding) {
        result.end.x = state1.x + state1.width + padding;
      }
    } else {
      result.start.x = state1.x;

      if (result.end.x > state1.x - padding) {
        result.end.x = state1.x - padding;
      }
    }

    if (result.start.y + padding > condition.y) {
      result.start.y = condition.y - padding;
    }
  } else {
    result.start.y = state1.y + padding;
    result.end.x = conditionXCenter;
    result.end.y = condition.y + condition.height;

    if (s1SectorX === 'left') {
      result.start.x = state1.x + state1.width;
    } else {
      result.start.x = state1.x;
    }

    if (result.start.y - padding < condition.y + condition.height) {
      result.start.y = condition.y + condition.height + padding;
    }
  }

  if (s1SectorX === 'left' && result.end.x < state1.x + state1.width + padding) {
    result.end.x = state1.x + state1.width + padding;
  }
  if (s1SectorX === 'right' && result.end.x > state1.x - padding) {
    result.end.x = state1.x - padding;
  }

  result.mid = {
    x: result.end.x,
    y: result.start.y,
  };

  return result;
};
