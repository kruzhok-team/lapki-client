import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { Canvas } from './Canvas';

import type { CanvasEditor } from '../CanvasEditor';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
}

const context = {
  fillRect: vi.fn(),
  restore: vi.fn(),
  resetTransform: vi.fn(),
  save: vi.fn(),
  setTransform: vi.fn(),
  set fillStyle(_value: string) {},
} as unknown as CanvasRenderingContext2D;

const mediaQueries: Array<{
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  trigger: () => void;
}> = [];

describe('Canvas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mediaQueries.length = 0;

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    vi.spyOn(window, 'matchMedia').mockImplementation(() => {
      let changeHandler: (() => void) | undefined;
      const query = {
        addEventListener: vi.fn((_event: string, handler: () => void) => {
          changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
        trigger: () => changeHandler?.(),
      };
      mediaQueries.push(query);
      return query as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createCanvas = (width: number, height: number, pixelRatio: number) => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: pixelRatio,
    });

    const root = document.createElement('div');
    Object.defineProperties(root, {
      offsetWidth: { configurable: true, value: width },
      offsetHeight: { configurable: true, value: height },
    });

    const canvas = new Canvas({ id: 'diagram', root } as unknown as CanvasEditor);
    root.append(canvas.element);
    canvas.resize();
    vi.advanceTimersByTime(10);

    return canvas;
  };

  test('keeps logical size while scaling the backing store by device pixel ratio', () => {
    const canvas = createCanvas(800, 600, 2);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(canvas.element.style.width).toBe('800px');
    expect(canvas.element.style.height).toBe('600px');
    expect(canvas.element.width).toBe(1600);
    expect(canvas.element.height).toBe(1200);
    expect(context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);

    canvas.cleanUp();
  });

  test('resizes the backing store when device pixel ratio changes', () => {
    const canvas = createCanvas(800, 600, 2);

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1.5,
    });
    mediaQueries.at(-1)?.trigger();
    vi.advanceTimersByTime(10);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(canvas.element.width).toBe(1200);
    expect(canvas.element.height).toBe(900);
    expect(context.setTransform).toHaveBeenLastCalledWith(1.5, 0, 0, 1.5, 0, 0);

    canvas.cleanUp();
  });
});
