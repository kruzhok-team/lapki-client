import { useModal } from './useModal';

export const useEditEventModal = () => {
  const [isOpen, open, close] = useModal(false);

  return {
    props: {
      isEditEventModalOpen: isOpen,
    },
    openEditEventModal: open,
    closeEditEventModal: close,
  };
};
