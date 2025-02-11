import { useState } from 'react';

import { State } from '@renderer/lib/drawable';
import { EventData } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useEditEventModal = () => {
  const [isOpen, open, close] = useModal(false);
  const [state, setState] = useState<State | null>(null);
  const [currentEventIdx, setCurrentEventIdx] = useState<number | undefined>();
  const [currentEvent, setCurrentEvent] = useState<EventData | undefined>();
  return {
    props: {
      isEditEventModalOpen: isOpen,
    },
    openEditEventModal: open,
    closeEditEventModal: close,
    state,
    setState,
    currentEventIdx,
    setCurrentEventIdx,
    currentEvent,
    setCurrentEvent,
  };
};
