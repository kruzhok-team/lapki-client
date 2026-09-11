import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@renderer/components/UI', () => ({
  ParameterSelect: ({ inputId, isDisabled }: { inputId: string; isDisabled?: boolean }) => (
    <select aria-label={inputId} disabled={isDisabled} />
  ),
}));

import { SimulationRunPanel } from './SimulationRunPanel';

const callbacks = {
  onModeChange: vi.fn(),
  onTimeoutChange: vi.fn(),
  onStart: vi.fn(),
  onCancel: vi.fn(),
};

describe('SimulationRunPanel', () => {
  it('shows one enabled start button when the simulator is ready', () => {
    const html = renderToStaticMarkup(
      <SimulationRunPanel
        machineSelector={<div />}
        mode="finite"
        timeout={10}
        ready
        active={false}
        {...callbacks}
      />
    );

    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('>Запустить</button>');
    expect(html).not.toContain('<button type="button" disabled=""');
    expect(html).not.toContain('<select aria-label="simulator-mode" disabled=""');
  });

  it('locks run parameters and replaces start with an enabled cancel button while active', () => {
    const html = renderToStaticMarkup(
      <SimulationRunPanel
        machineSelector={<div />}
        mode="finite"
        timeout={10}
        ready
        active
        {...callbacks}
      />
    );

    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('>Отменить</button>');
    expect(html).not.toContain('<button type="button" disabled=""');
    expect(html).toContain('<select aria-label="simulator-mode" disabled=""');
    expect(html).toContain('id="simulator-timeout"');
    expect(html).toMatch(/id="simulator-timeout"[^>]*disabled=""/);
  });

  it('can reserve feedback space while a result message is absent', () => {
    const html = renderToStaticMarkup(
      <SimulationRunPanel
        machineSelector={<div />}
        mode="finite"
        timeout={10}
        ready
        active
        reserveFeedbackSpace
        {...callbacks}
      />
    );

    expect(html).toContain('mt-3 min-h-4 space-y-3');
  });
});
