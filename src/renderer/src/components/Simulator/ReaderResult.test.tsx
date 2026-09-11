import { createElement, type ReactNode } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { SimulationResult } from '@renderer/types/InterpreterTypes';

vi.mock('@renderer/components/UI/ScrollArea', () => ({
  ScrollArea: ({
    children,
    className,
    horizontalScroll,
  }: {
    children: ReactNode;
    className?: string;
    horizontalScroll?: boolean;
  }) =>
    createElement(
      'div',
      {
        className,
        'data-scroll-area': 'true',
        'data-horizontal-scroll': horizontalScroll,
      },
      children
    ),
}));

import { ReaderResult } from './ReaderResult';

const result: SimulationResult = {
  status: 'success',
  result: {
    signals: ['reader.char_accepted', 'reader.line_finished'],
    calledSignals: ['impulseA'],
  },
};

describe('ReaderResult', () => {
  it('shows output impulses without system events', () => {
    const html = renderToStaticMarkup(
      <ReaderResult result={result} stale={false} active={false} />
    );

    expect(html).toContain('Импульс А');
    expect(html).not.toContain('impulseA');
    expect(html).not.toContain('Завершено');
    expect(html).not.toContain('grid-cols-[2rem_minmax(0,1fr)]');
    expect(html).not.toContain('bg-bg-secondary');
    expect(html).toContain('data-scroll-area="true"');
    expect(html).toContain('data-horizontal-scroll="false"');
    expect(html).toContain('max-h-[236px]');
    expect(html).not.toContain('reader.char_accepted');
    expect(html).not.toContain('reader.line_finished');
    expect(html).not.toContain('Системные события');
  });

  it('keeps a stale result visible with a warning', () => {
    const html = renderToStaticMarkup(<ReaderResult result={result} stale active={false} />);

    expect(html).toContain('Результат устарел');
    expect(html).toContain('Импульс А');
  });

  it('shows an empty state before the first run', () => {
    const html = renderToStaticMarkup(<ReaderResult stale={false} active={false} />);

    expect(html).toContain('Импульсы появятся после запуска');
  });

  it('explains that impulses will appear when the active run finishes', () => {
    const html = renderToStaticMarkup(<ReaderResult stale={false} active />);

    expect(html).toContain('Импульсы появятся после окончания работы');
    expect(html).not.toContain('Импульсы появятся после запуска');
  });

  it('shows an unnumbered empty state without a gray background', () => {
    const html = renderToStaticMarkup(
      <ReaderResult
        result={{ status: 'success', result: { signals: [], calledSignals: [] } }}
        stale={false}
        active={false}
      />
    );

    expect(html).toContain('Нет выходных импульсов');
    expect(html).not.toContain('Завершено');
    expect(html).not.toContain('bg-bg-secondary');
  });
});
