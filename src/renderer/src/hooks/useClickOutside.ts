import { useEffect } from 'react';

export const useClickOutside = (
  element: HTMLElement | null,
  action: () => void,
  disabled = false,
  additionalElement: HTMLElement | null = null
) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (disabled || !element) return;

      if (element.contains(e.target as HTMLElement)) return;
      if (additionalElement && additionalElement.contains(e.target as HTMLElement)) return;

      action();
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [element, action, disabled, additionalElement]);
};
