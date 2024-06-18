import { useEffect } from 'react';

export const useClickOutside = (
  element: HTMLElement | null,
  action: () => void,
  disabled = false,
  additionalElement: HTMLElement | string | null = null
) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (disabled || !element) return;

      if (element.contains(e.target as HTMLElement)) return;
      if (additionalElement) {
        const element =
          typeof additionalElement === 'string'
            ? document.querySelectorAll(additionalElement)
            : additionalElement;

        if (
          element &&
          ((element instanceof HTMLElement && element.contains(e.target as HTMLElement)) ||
            (element instanceof NodeList &&
              [...element.values()].some((el) => el.contains(e.target as HTMLElement))))
        )
          return;
      }

      action();
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [element, action, disabled, additionalElement]);
};
