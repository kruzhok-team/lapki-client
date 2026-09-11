import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionHistory } from './ExecutionHistory';

describe('ExecutionHistory', () => {
  it('keeps all controls visible and disabled before the first run', () => {
    const html = renderToStaticMarkup(
      <ExecutionHistory
        steps={[]}
        historyIndex={0}
        isPlaying={false}
        isTruncated={false}
        onSelectStep={vi.fn()}
        onTogglePlayback={vi.fn()}
      />
    );

    expect(html).not.toContain('История появится после запуска');
    expect(html).toContain('Воспроизвести');
    expect(html).toContain('Назад');
    expect(html).toContain('Вперёд');
    expect(html).toContain('Шаг 0 / 0');
    expect(html).toContain('Позиция: —');
    expect(html.match(/disabled=""/g)).toHaveLength(4);
  });
});
