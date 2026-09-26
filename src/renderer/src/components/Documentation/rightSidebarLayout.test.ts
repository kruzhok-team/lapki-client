import { describe, expect, it } from 'vitest';

import { getRightSidebarOffset, RIGHT_SIDEBAR_CLOSED_WIDTH } from './rightSidebarLayout';

describe('right sidebar layout', () => {
  it('uses the saved panel width while the sidebar is open', () => {
    expect(getRightSidebarOffset(true, 560)).toBe(560);
  });

  it('uses only the collapsed handle width after the last view is closed', () => {
    expect(getRightSidebarOffset(false, 560)).toBe(RIGHT_SIDEBAR_CLOSED_WIDTH);
  });
});
