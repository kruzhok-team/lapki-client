import { useLayoutEffect, useState } from 'react';

const DEFAULT_PORTAL_Z_INDEX = 100;

type ElementRef = {
  readonly current: unknown;
};

export const getPortalZIndex = (reference: Element | null, fallback = DEFAULT_PORTAL_Z_INDEX) => {
  let highestParentZIndex: number | undefined;
  let parent = reference?.parentElement ?? null;

  while (parent) {
    const computedZIndex = window.getComputedStyle(parent).zIndex;
    const zIndex = Number(computedZIndex);

    if (computedZIndex !== '' && computedZIndex !== 'auto' && Number.isInteger(zIndex)) {
      highestParentZIndex = Math.max(highestParentZIndex ?? zIndex, zIndex);
    }

    parent = parent.parentElement;
  }

  return highestParentZIndex === undefined ? fallback : highestParentZIndex + 1;
};

/**
 * Keeps an element rendered into document.body one layer above the UI that
 * opened it. This is needed for portals because they do not inherit their
 * reference element's stacking context.
 */
export const usePortalZIndex = (
  referenceRef: ElementRef,
  enabled = true,
  fallback = DEFAULT_PORTAL_Z_INDEX
) => {
  const [zIndex, setZIndex] = useState(fallback);

  useLayoutEffect(() => {
    if (!enabled) return;

    const reference = referenceRef.current;

    if (!(reference instanceof Element)) return;

    const updateZIndex = () => setZIndex(getPortalZIndex(reference, fallback));
    updateZIndex();

    const parents: Element[] = [];
    let parent = reference.parentElement;

    while (parent) {
      parents.push(parent);
      parent = parent.parentElement;
    }

    const observer = new MutationObserver(updateZIndex);
    parents.forEach((element) =>
      observer.observe(element, { attributes: true, attributeFilter: ['class', 'style'] })
    );

    return () => observer.disconnect();
  }, [enabled, fallback, referenceRef]);

  return zIndex;
};
