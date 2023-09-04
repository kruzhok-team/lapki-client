import { useEffect } from 'react';

export const useClickOutside = (
  element: HTMLElement | null,
  action: () => void,
  disabled = false
) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (disabled || !element) return;

      if (!element.contains(e.target as HTMLElement)) {
        action();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [element, action, disabled]);
};
