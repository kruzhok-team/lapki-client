import { Rectangle, Point, TransitionLine, VSector, HSector } from '@renderer/lib/types/graphics';
import { Variable } from '@renderer/types/diagram';

import { Transition } from '../drawable';

export * from './generateId';
export * from './roundPoint';

export const isVariable = (value: any): value is Variable => {
  return value['component'] !== undefined && value['method'] !== undefined;
};

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

const getSectors = (
  rect1Left: number,
  rect1Right: number,
  rect1Top: number,
  rect1Bottom: number,
  rect2XCenter: number,
  rect2YCenter: number,
  rectPadding: number
) => {
  // В этой функции мы проверяем, с какой стороны будем
  // цеплять стрелку к target
  let sectorH: HSector = 'center';
  let sectorV: VSector = 'center';

  if (rect2XCenter > rect1Right - rectPadding) {
    // если центр цели правее source
    sectorH = 'left';
  } else if (rect2XCenter < rect1Left + rectPadding) {
    // если центр цели левее source
    sectorH = 'right';
  }

  if (rect2YCenter > rect1Bottom - rectPadding) {
    // если центр цели ниже source
    sectorV = 'top';
  } else if (rect2YCenter < rect1Top + rectPadding) {
    // если центр цели выше source
    sectorV = 'bottom';
  }

  return { sectorH, sectorV };
};

const getArrowAngle = (start: Point, end: Point) => {
  if (start.x === end.x) {
    return start.y >= end.y ? 90 : 270;
  }

  return start.x >= end.x ? 0 : 180; // разве не должно быть start.x >= end.x ? 180 : 0
};

interface GetLineParams {
  rect1: Rectangle;
  rect2: Rectangle;
  rect1OnlyFourPoint?: boolean;
  rect2OnlyFourPoint?: boolean;
  rect1Padding?: number;
  rect2Padding?: number;
  rectPadding: number;
  start?: Point;
  end?: Point;
}

export const getLine = (params: GetLineParams) => {
  const { rect1, rect2, rectPadding, start, end } = params;

  const rect1Left = start ? start.x : rect1.x; // x левый угол source
  const rect1Right = start ? start.x : rect1.x + rect1.width; //  x Правый угол source
  const rect1Top = start ? start.y : rect1.y; // y левый верхний угол source
  const rect1Bottom = start ? start.y : rect1.y + rect1.height; // y левый нижний угол

  const rect2Left = end ? end.x : rect2.x;
  const rect2Right = end ? end.x : rect2.x + rect2.width;
  const rect2Top = end ? end.y : rect2.y;
  const rect2Bottom = end ? end.y : rect2.y + rect2.height;
  const rect2XCenter = rect2.x + rect2.width / 2;
  const rect2YCenter = rect2.y + rect2.height / 2;

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
      x: params.start?.x ?? 0,
      y: params.start?.y ?? 0,
    },
    mid: null,
    end: {
      x: params.end?.x ?? 0,
      y: params.end?.y ?? 0,
    },
    // se/ee используются для отрисовки треугольника на конце стрелок
    se: 0, // используется при отрисовки обычных стрелок
    ee: 0, // используется при отрисовки ghost transitions
  };

  if (!params.end || !params.start) {
    if (sectorV === 'center') {
      // get straight lines
      if (!start) {
        // вариант center-center, который может быть,
        // если source находится прямо в target
        // считается не очень хорошо
        result.start.x = sectorH === 'left' ? rect1Right : rect1Left;
        result.start.y = rect2YCenter;
      }
      if (!end) {
        result.end.x = sectorH === 'left' ? rect2Left : rect2Right;
        result.end.y = result.start.y;
      }

      result.se = getArrowAngle(result.start, result.end);
      result.ee = getArrowAngle(result.end, result.start);

      return result;
    }

    if (sectorH === 'center') {
      if (!start) {
        result.start.x = rect2XCenter;
        result.start.y = sectorV === 'top' ? rect1Bottom : rect1Top;
      }
      if (!end) {
        result.end.x = result.start.x;
        result.end.y = sectorV === 'top' ? rect2Top : rect2Bottom;
      }

      result.se = getArrowAngle(result.start, result.end);
      result.ee = getArrowAngle(result.end, result.start);
      return result;
    }

    // get curve lines
    if (sectorV === 'top') {
      if (!start) {
        result.start.y = rect1Bottom - rectPadding;
      }
      if (!end) {
        result.end.x = rect2XCenter;
        result.end.y = rect2Top;
      }

      if (sectorH === 'left') {
        if (!start) {
          result.start.x = rect1Right;
        }

        if (!end) {
          // line in rect restriction
          if (result.end.x < rect1Right + rectPadding) {
            result.end.x = rect1Right + rectPadding;
          }
        }
      } else {
        if (!start) {
          result.start.x = rect1Left;
        }

        if (!end) {
          // line in rect restriction
          if (result.end.x > rect1Left - rectPadding) {
            result.end.x = rect1Left - rectPadding;
          }
        }
      }

      // line in rect restriction
      if (!start) {
        if (result.start.y + rectPadding > rect2Top) {
          result.start.y = rect2Top - rectPadding;
        }
      }
    } else {
      if (!start) {
        result.start.y = rect1Top + rectPadding;
      }
      if (!end) {
        result.end.x = rect2XCenter;
        result.end.y = rect2Bottom;
      }

      if (!start) {
        if (sectorH === 'left') {
          result.start.x = rect1Right;
        } else {
          result.start.x = rect1Left;
        }
        // line in rect restriction
        // Как будто это вызывается только для маленьких объектов
        // У которых rectPadding больше всей высоты объекта
        // Как будто мы вообще не должны сюда заходить...
        if (result.start.y - rectPadding < rect2Bottom) {
          result.start.y = rect2Bottom + rectPadding;
        }
      }
    }

    // line in rect restriction
    if (!end) {
      if (sectorH === 'left' && result.end.x < rect1Right + rectPadding) {
        result.end.x = rect1Right + rectPadding;
      }
      if (sectorH === 'right' && result.end.x > rect1Left - rectPadding) {
        result.end.x = rect1Left - rectPadding;
      }
    }
    result.mid = {
      x: result.end.x,
      y: result.start.y,
    };

    result.se = getArrowAngle(result.start, result.mid);
    result.ee = getArrowAngle(result.end, result.mid);
  }

  // result.mid = {
  //   x: result.end.x,
  //   y: result.start.y,
  // };

  return result;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(min, value), max);
};

export const preloadImages = (urls: string[]) => {
  const promises = urls.map((url): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(`Image failed to load: ${url}`);

      image.src = url;
    });
  });

  return Promise.all(promises);
};

export const preloadImagesMap = (
  m: Map<string, HTMLImageElement>,
  urls: { [x: string]: string }
) => {
  const promises = Object.entries(urls).map(([key, url]): Promise<[string, HTMLImageElement]> => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        m.set(key, image);
        resolve([key, image]);
      };
      image.onerror = () => reject(`Image failed to load: ${url}`);

      image.src = url;
    });
  });

  return Promise.all(promises);
};

export const drawImageFit = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  containerBounds: Rectangle
) => {
  const { x, y, width, height } = containerBounds;

  const hRatio = width / img.naturalWidth;
  const vRatio = height / img.naturalHeight;
  const ratio = Math.min(hRatio, vRatio);
  const centerShiftX = x + (width - img.naturalWidth * ratio) / 2;
  const centerShiftY = y + (height - img.naturalHeight * ratio) / 2;

  ctx.drawImage(
    img,
    centerShiftX,
    centerShiftY,
    img.naturalWidth * ratio,
    img.naturalHeight * ratio
  );
};

export const drawCurvedLine = (
  ctx: CanvasRenderingContext2D,
  line: TransitionLine,
  rounded: number
) => {
  const { start, mid, end } = line;

  ctx.beginPath();

  ctx.moveTo(start.x, start.y);

  // просто отступаем на радиус в обе стороны и рисуем дугу между этими двумя точками
  if (mid) {
    const p1x = mid.x - (start.x < mid.x ? rounded : -rounded);
    const p1y = mid.y;
    const p2x = mid.x;
    const p2y = mid.y - (end.y < mid.y ? rounded : -rounded);

    ctx.lineTo(p1x, p1y);

    ctx.bezierCurveTo(p1x, p1y, mid.x, mid.y, p2x, p2y);
  }
  ctx.lineTo(end.x, end.y);

  ctx.stroke();

  ctx.closePath();
};

interface DrawCircleOptions {
  position: Point;
  radius: number;
  fillStyle?: CanvasFillStrokeStyles['fillStyle'];
  strokeStyle?: CanvasFillStrokeStyles['strokeStyle'];
  lineWidth?: CanvasPathDrawingStyles['lineWidth'];
}

export const drawCircle = (ctx: CanvasRenderingContext2D, options: DrawCircleOptions) => {
  const { position, radius, fillStyle, strokeStyle, lineWidth } = options;

  const prevFillStyle = ctx.fillStyle;
  const prevStrokeStyle = ctx.strokeStyle;
  const prevLineWidth = ctx.lineWidth;

  if (fillStyle) ctx.fillStyle = fillStyle;
  if (strokeStyle) ctx.strokeStyle = strokeStyle;
  if (lineWidth) ctx.lineWidth = lineWidth;

  ctx.beginPath();

  ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);

  if (fillStyle) ctx.fill();
  if (strokeStyle) ctx.stroke();

  ctx.closePath();

  ctx.fillStyle = prevFillStyle;
  ctx.strokeStyle = prevStrokeStyle;
  ctx.lineWidth = prevLineWidth;
};

export const drawTriangle = (
  ctx: CanvasRenderingContext2D,
  position: Point,
  size: number,
  angle: number
) => {
  const p1 = rotatePoint({ x: position.x - size, y: position.y - size / 2 }, position, angle);
  const p2 = rotatePoint({ x: position.x - size, y: position.y + size / 2 }, position, angle);

  ctx.beginPath();

  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(position.x, position.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p1.x, p1.y);

  ctx.fill();

  ctx.closePath();
};

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

// Метод для проверки попадания точки на отрезок с учетом ширины линии
export const isPointOnSegment = (
  start: Point,
  end: Point,
  x: number,
  y: number,
  lineWidth: number
): boolean => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  // Проекция точки на линию
  let t = ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t)); // Ограничить t от 0 до 1

  // Находим ближайшую точку на линии
  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;

  // Рассчитываем расстояние от точки до ближайшей точки на линии
  const distance = Math.sqrt((x - closestX) * (x - closestX) + (y - closestY) * (y - closestY));

  // Проверяем, находится ли расстояние в пределах ширины линии
  return distance <= lineWidth / 2;
};

// Метод для проверки попадания точки на линии
export const isCheckPointOnLine = (pos, line): boolean => {
  // FIXME: (XidFanSan) нужно ли масштабировать ширину линии?
  // lineWidth - это значение масштаба ширины линии
  const lineWidth = 10;

  const { x, y } = pos;
  if (line.mid) {
    // Проверка попадания на первую часть линии
    if (isPointOnSegment(line.start, line.mid, x, y, lineWidth)) return true;
    // Проверка попадания на вторую часть линии
    if (isPointOnSegment(line.mid, line.end, x, y, lineWidth)) return true;
  } else {
    // Проверка попадания на прямую линию
    if (isPointOnSegment(line.start, line.end, x, y, lineWidth)) return true;
  }
  return false;
};

export const isPointOnLine = (x: number, y: number, transition: Transition) => {
  const targetBounds = transition.target.drawBounds;
  const sourceBounds = transition.source.drawBounds;

  if (transition.data.label) {
    const sourceLine = getLine({
      rect1: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      rect2: transition.drawBounds,
      rectPadding: 10,
    });
    const targetLine = getLine({
      rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      rect2: transition.drawBounds,
      rectPadding: 10,
    });
    return isCheckPointOnLine({ x, y }, sourceLine) || isCheckPointOnLine({ x, y }, targetLine);
  } else {
    const line = getLine({
      rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      rect2: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      rectPadding: 10,
    });
    return isCheckPointOnLine({ x, y }, line);
  }
};

export const isEqualPoints = (point: Point, point2: Point) => {
  return point.x == point2.x && point.y === point2.y;
};
