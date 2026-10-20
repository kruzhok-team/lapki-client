import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { CanvasController } from './data/ModelController/CanvasController';

vi.mock('@renderer/lib/basic', () => ({
  Canvas: class {
    element = document.createElement('canvas');
    resize = vi.fn();
    on = vi.fn();
    cleanUp = vi.fn();
  },
  EditorView: class {
    isDirty = true;
    initEvents = vi.fn();
    removeEvents = vi.fn();
  },
  Keyboard: class {
    cleanUp = vi.fn();
  },
  Mouse: class {
    setOffset = vi.fn();
    clearUp = vi.fn();
  },
}));

vi.mock('@renderer/lib/common', () => ({
  Render: class {
    subscribe = vi.fn(() => vi.fn());
  },
}));

vi.mock('@renderer/lib/drawable', () => ({ preloadPicto: vi.fn() }));

describe('canvas font loading', () => {
  let fonts: EventTarget & { ready: Promise<void> };
  let finishLoading: () => void;
  let characterWidth: number;
  let editor: InstanceType<typeof import('./CanvasEditor').CanvasEditor>;
  let text: typeof import('./utils/text');
  let rows: string[];
  let prepareText: ReturnType<typeof vi.fn>;
  let mounted: boolean;

  beforeEach(async () => {
    vi.resetModules();
    characterWidth = 6;
    fonts = Object.assign(new EventTarget(), {
      ready: new Promise<void>((resolve) => {
        finishLoading = resolve;
      }),
    });
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      font: '10px sans-serif',
      measureText: (value: string) => ({ width: value.length * characterWidth }),
    } as CanvasRenderingContext2D);

    const { CanvasEditor } = await import('./CanvasEditor');
    text = await import('./utils/text');
    rows = [];
    prepareText = vi.fn(() => {
      rows = text.prepareText('abc def', 50, { fontFamily: 'Fira Sans' }).textArray;
    });
    editor = new CanvasEditor('diagram');
    editor.setController({
      notes: { forEach: (callback: (note: unknown) => void) => callback({ prepareText }) },
      transitions: { initEvents: vi.fn() },
      initializer: { init: vi.fn() },
      setMountStatus: vi.fn(),
      loadData: prepareText,
      watchDrawable: vi.fn(),
      unwatchDrawable: vi.fn(),
    } as unknown as CanvasController);
    editor.mount(document.createElement('div'));
    mounted = true;
    editor.view.isDirty = false;
  });

  afterEach(() => {
    if (mounted) editor.unmount();
    Reflect.deleteProperty(document, 'fonts');
    vi.restoreAllMocks();
  });

  test('reflows notes and requests a redraw when the initial font load finishes', async () => {
    expect(rows).toEqual(['abc def']);
    expect(text.getTextWidth('abc def', "16px 'Fira Sans'")).toBe(42);

    characterWidth = 12;
    finishLoading();
    await fonts.ready;

    expect(rows).toEqual(['abc', 'def']);
    expect(text.getTextWidth('abc def', "16px 'Fira Sans'")).toBe(84);
    expect(editor.view.isDirty).toBe(true);
  });

  test('reflows notes when another font finishes loading after the initial load', async () => {
    finishLoading();
    await fonts.ready;
    editor.view.isDirty = false;
    characterWidth = 12;

    fonts.dispatchEvent(new Event('loadingdone'));

    expect(rows).toEqual(['abc', 'def']);
    expect(editor.view.isDirty).toBe(true);
  });

  test('ignores pending font loading and removes the listener after unmount', async () => {
    editor.unmount();
    mounted = false;
    prepareText.mockClear();
    characterWidth = 12;

    finishLoading();
    await fonts.ready;
    fonts.dispatchEvent(new Event('loadingdone'));

    expect(prepareText).not.toHaveBeenCalled();
    expect(editor.view.isDirty).toBe(false);
  });
});
