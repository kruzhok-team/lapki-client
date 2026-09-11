// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { getPortalZIndex } from './usePortalZIndex';

describe('getPortalZIndex', () => {
  it('uses the fallback outside a stacking layer', () => {
    const reference = document.createElement('button');
    document.body.append(reference);

    expect(getPortalZIndex(reference)).toBe(100);

    reference.remove();
  });

  it('places a portal above the highest parent layer', () => {
    const windowElement = document.createElement('div');
    const nestedLayer = document.createElement('div');
    const reference = document.createElement('button');

    windowElement.style.zIndex = '201';
    nestedLayer.style.zIndex = '10';
    nestedLayer.append(reference);
    windowElement.append(nestedLayer);
    document.body.append(windowElement);

    expect(getPortalZIndex(reference)).toBe(202);

    windowElement.remove();
  });
});
