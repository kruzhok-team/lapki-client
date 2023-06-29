import { Rectangle, Point, TransitionLine, VSector, HSector } from '@renderer/types/graphics';

export const isPointInRectangle = (rectangle: Rectangle, point: Point) => {
  return (
    rectangle.x <= point.x &&
    point.x <= rectangle.x + rectangle.width &&
    rectangle.y <= point.y &&
    point.y <= rectangle.y + rectangle.height
  );
};

export const degrees_to_radians = (degrees: number) => {
  return degrees * (Math.PI / 180);
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

const getDistanceBetweenPoints = (p1: Point, p2: Point) => {
  return (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
};

const getRectangleCenter = (rect: Rectangle): Point => {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
};

const getDistanceBetweenRectangles = (rect1: Rectangle, rect2: Rectangle) => {
  const c1 = getRectangleCenter(rect1);
  const c2 = getRectangleCenter(rect2);

  return getDistanceBetweenPoints(c1, c2);
};

const getSectors = (
  rect1Left: number,
  rect1Right: number,
  rect1Top: number,
  rect1Bottom: number,
  rect2XCenter: number,
  rect2YCenter: number,
  rectPadding
) => {
  let sectorH: HSector = 'center';
  let sectorV: VSector = 'center';

  if (rect2XCenter > rect1Right - rectPadding) {
    sectorH = 'left';
  } else if (rect2XCenter < rect1Left + rectPadding) {
    sectorH = 'right';
  }

  if (rect2YCenter > rect1Bottom - rectPadding) {
    sectorV = 'top';
  } else if (rect2YCenter < rect1Top + rectPadding) {
    sectorV = 'bottom';
  }

  return { sectorH, sectorV };
};

const getArrowAngle = (rect: Rectangle, point: Point) => {
  if (point.y === rect.y) {
    return 90;
  } else if (point.y === rect.y + rect.height) {
    return 270;
  } else if (point.x === rect.x) {
    return 0;
  } else {
    return 180;
  }
};

const getLine = (
  rect1: Rectangle,
  rect2: Rectangle,
  rectPadding: number,
  startLinePadding: number,
  endLinePadding: number
) => {
  const rect2Left = rect2.x;
  const rect2Right = rect2.x + rect2.width;
  const rect2Top = rect2.y;
  const rect2Bottom = rect2.y + rect2.height;
  const rect2XCenter = rect2.x + rect2.width / 2;
  const rect2YCenter = rect2.y + rect2.height / 2;

  const rect1Left = rect1.x;
  const rect1Right = rect1.x + rect1.width;
  const rect1Top = rect1.y;
  const rect1Bottom = rect1.y + rect1.height;

  const { sectorV, sectorH } = getSectors(
    rect1Left,
    rect1Right,
    rect1Top,
    rect1Bottom,
    rect2XCenter,
    rect2YCenter,
    rectPadding
  );

  const result: TransitionLine = {
    start: {
      x: 0,
      y: 0,
    },
    mid: null,
    end: {
      x: 0,
      y: 0,
    },
    se: 0,
  };

  // get straight lines
  if (sectorV === 'center') {
    result.start.x = sectorH === 'left' ? rect1Right : rect1Left;
    result.start.y = rect2YCenter;
    result.end.x = sectorH === 'left' ? rect2Left : rect2Right;
    result.end.y = result.start.y;

    result.se = getArrowAngle(rect1, result.start);

    return result;
  }

  if (sectorH === 'center') {
    result.start.x = rect2XCenter;
    result.start.y = sectorV === 'top' ? rect1Bottom : rect1Top;
    result.end.x = result.start.x;
    result.end.y = sectorV === 'top' ? rect2Top : rect2Bottom;

    result.se = getArrowAngle(rect1, result.start);

    return result;
  }

  // get curve lines
  if (sectorV === 'top') {
    result.start.y = rect1Bottom - rectPadding;
    result.end.x = rect2XCenter;
    result.end.y = rect2Top;

    if (sectorH === 'left') {
      result.start.x = rect1Right;

      // line in rect restriction
      if (result.end.x < rect1Right + rectPadding) {
        result.end.x = rect1Right + rectPadding;
      }
    } else {
      result.start.x = rect1Left;

      // line in rect restriction
      if (result.end.x > rect1Left - rectPadding) {
        result.end.x = rect1Left - rectPadding;
      }
    }

    // line in rect restriction
    if (result.start.y + rectPadding > rect2Top) {
      result.start.y = rect2Top - rectPadding;
    }
  } else {
    result.start.y = rect1Top + rectPadding;
    result.end.x = rect2XCenter;
    result.end.y = rect2Bottom;

    if (sectorH === 'left') {
      result.start.x = rect1Right;
    } else {
      result.start.x = rect1Left;
    }

    // line in rect restriction
    if (result.start.y - rectPadding < rect2Bottom) {
      result.start.y = rect2Bottom + rectPadding;
    }
  }

  // line in rect restriction
  if (sectorH === 'left' && result.end.x < rect1Right + rectPadding) {
    result.end.x = rect1Right + rectPadding;
  }
  if (sectorH === 'right' && result.end.x > rect1Left - rectPadding) {
    result.end.x = rect1Left - rectPadding;
  }

  result.mid = {
    x: result.end.x,
    y: result.start.y,
  };

  result.se = getArrowAngle(rect1, result.start);

  return result;
};

export const getTransitionLines = (
  state1: Rectangle,
  state2: Rectangle,
  condition: Rectangle,
  rectPadding: number = 0,
  startLinePadding: number = 0,
  endLinePadding: number = 0
) => {
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

  const sourceLine = getLine(state1, condition, rectPadding, startLinePadding, endLinePadding);
  const targetLine = getLine(state2, condition, rectPadding, startLinePadding, endLinePadding);

  return { sourceLine, targetLine };
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(min, value), max);
};
