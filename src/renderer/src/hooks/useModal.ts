import { useState } from 'react';

export const useModal = (defaultValue: boolean) => {
  const [isOpen, setIsOpen] = useState(defaultValue);

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return [isOpen, open, close] as const;
};
