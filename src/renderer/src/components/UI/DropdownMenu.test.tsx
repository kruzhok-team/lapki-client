import type { SVGProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DropdownMenuItem } from './DropdownMenu';

vi.mock('@renderer/assets/icons/arrow-down.svg', () => ({
  ReactComponent: (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 10 10" {...props} />,
}));

vi.mock('@renderer/assets/icons/check.svg', () => ({
  ReactComponent: (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 8 8" {...props} />,
}));

describe('DropdownMenuItem', () => {
  it('adds the hierarchy arrow to submenu triggers', () => {
    const html = renderToStaticMarkup(
      <DropdownMenuItem aria-haspopup="menu">Тема</DropdownMenuItem>
    );

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('-rotate-90');
    expect(html).toContain('<svg');
  });

  it('shows a check icon for a selected radio item', () => {
    const html = renderToStaticMarkup(
      <DropdownMenuItem role="menuitemradio" aria-checked>
        Вкл
      </DropdownMenuItem>
    );

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('viewBox="0 0 8 8"');
  });

  it('reserves the icon slot for an unselected radio item', () => {
    const html = renderToStaticMarkup(
      <DropdownMenuItem role="menuitemradio" aria-checked={false}>
        Выкл
      </DropdownMenuItem>
    );

    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('size-2.5');
    expect(html).not.toContain('<svg');
  });
});
