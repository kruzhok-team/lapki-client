import { useFloating, offset, flip, shift } from '@floating-ui/react';

import { useModal } from '@renderer/hooks';

export const useDropDownSmList = () => {
  const { refs, floatingStyles } = useFloating({
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });
  const [isOpen, open, close] = useModal(false);

  return {
    refs,
    floatingStyles,
    isSmDropDownOpen: isOpen,
    openSmDropDown: open,
    closeSmDropDown: close,
    setFloating: refs.setFloating,
    setSmDropDownReference: refs.setReference,
  };
};
