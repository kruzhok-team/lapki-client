import { describe, expect, it, vi } from 'vitest';

import { Platform } from '@renderer/types/platform';

vi.mock('./PlatformLoader', () => ({ getPlatform: vi.fn() }));
vi.mock('./ElementsValidator', () => ({
  isDefaultComponent: ({ component }: { component: string }) => component === 'System',
  convertDefaultComponent: (_component: string, method: string) => method,
}));

import { serializeActions, serializeCondition, serializeEvent } from './GraphmlBuilder';

const platform: Platform = {
  id: 'test',
  compile: false,
  author: 'test',
  icon: '',
  formatVersion: '1',
  standardVersion: '1',
  staticComponents: false,
  delimeter: ';',
  version: '1',
  visual: true,
  staticActionDelimeter: '::',
  components: {},
};

describe('GraphML serialization with orphaned component references', () => {
  it('preserves an action instead of crashing', () => {
    expect(serializeActions([{ component: 'removed', method: 'run' }], {}, platform)).toBe(
      'removed.run();'
    );
  });

  it('preserves a trigger instead of crashing', () => {
    expect(serializeEvent({}, platform, { component: 'removed', method: 'changed' })).toBe(
      'removed.changed'
    );
  });

  it('preserves a variable in a condition instead of crashing', () => {
    expect(
      serializeCondition(
        {
          type: 'equals',
          value: [
            {
              type: 'component',
              value: { component: 'removed', method: 'value' },
            },
            { type: 'value', value: 1 },
          ],
        },
        platform,
        {}
      )
    ).toBe('removed.value == 1');
  });
});
