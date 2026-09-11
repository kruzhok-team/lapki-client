import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { FailureActions } from './FailureActions';

describe('FailureActions', () => {
  it('does not submit the surrounding loader form', () => {
    const html = renderToStaticMarkup(
      <form>
        <FailureActions
          reconnectLabel="Перезапустить"
          reconnectDisabled={false}
          onReconnect={vi.fn()}
          onShowErrorDescription={vi.fn()}
        />
      </form>
    );

    expect(html.match(/<button type="button"/g)).toHaveLength(2);
    expect(html).toContain('Перезапустить');
    expect(html).toContain('Описание ошибки');
  });
});
