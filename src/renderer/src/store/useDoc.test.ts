import { beforeEach, describe, expect, it } from 'vitest';

import { useDoc } from './useDoc';

const resetSidebar = () =>
  useDoc.setState({
    isOpen: false,
    visibleViews: { documentation: false, tasks: false },
    mountedViews: { documentation: false, tasks: false },
  });

describe('useDoc', () => {
  beforeEach(resetSidebar);

  it('opens sections independently and remembers that they were mounted', () => {
    useDoc.getState().onDocumentationToggle();
    expect(useDoc.getState()).toMatchObject({
      isOpen: true,
      visibleViews: { documentation: true, tasks: false },
      mountedViews: { documentation: true, tasks: false },
    });

    useDoc.getState().onTasksToggle();
    expect(useDoc.getState()).toMatchObject({
      visibleViews: { documentation: true, tasks: true },
      mountedViews: { documentation: true, tasks: true },
    });
  });

  it('collapses the sidebar after its last visible section is closed', () => {
    useDoc.getState().onDocumentationToggle();
    useDoc.getState().closeView('documentation');

    expect(useDoc.getState()).toMatchObject({
      isOpen: false,
      visibleViews: { documentation: false, tasks: false },
      mountedViews: { documentation: true, tasks: false },
    });
  });

  it('keeps the sidebar open while another section remains visible', () => {
    useDoc.getState().onDocumentationToggle();
    useDoc.getState().onTasksToggle();
    useDoc.getState().closeView('documentation');

    expect(useDoc.getState()).toMatchObject({
      isOpen: true,
      visibleViews: { documentation: false, tasks: true },
      mountedViews: { documentation: true, tasks: true },
    });
  });

  it('restores a visible section instead of toggling it off when the sidebar is collapsed', () => {
    useDoc.getState().onDocumentationToggle();
    useDoc.getState().toggleOpen();
    useDoc.getState().onDocumentationToggle();

    expect(useDoc.getState()).toMatchObject({
      isOpen: true,
      visibleViews: { documentation: true, tasks: false },
    });
  });

  it('keeps section state when the whole sidebar is collapsed', () => {
    useDoc.getState().onDocumentationToggle();
    useDoc.getState().onTasksToggle();
    useDoc.getState().toggleOpen();

    expect(useDoc.getState()).toMatchObject({
      isOpen: false,
      visibleViews: { documentation: true, tasks: true },
      mountedViews: { documentation: true, tasks: true },
    });
  });
});
