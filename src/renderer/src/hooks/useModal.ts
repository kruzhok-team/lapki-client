import { useCallback, useState } from 'react';

export const useModal = (defaultValue: boolean) => {
  const [isOpen, setIsOpen] = useState(defaultValue);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  return [isOpen, open, close] as const;
};
