import { useLayoutEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { StateMachine } from '@renderer/types/diagram';

import { Checkbox, Modal } from './UI';

interface SelectStateMachinesModalProps {
  isOpen: boolean;
  stateMachines: { [id: string]: StateMachine };
  onSubmit: (selectedSms: { [id: string]: boolean }) => void;
  close: () => void;
}

export const SelectStateMachinesModal: React.FC<SelectStateMachinesModalProps> = ({
  stateMachines,
  isOpen,
  onSubmit,
  close,
}) => {
  const [selectedStateMachines, setSelectedStateMachines] = useState<{ [id: string]: boolean }>({});

  useLayoutEffect(() => {
    handleAfterClose();
  }, [stateMachines]);

  const handleAfterClose = () => {
    const getDefaultValues = () => {
      const defaultMap: { [id: string]: boolean } = {};
      Object.keys(stateMachines).map((id) => {
        if (id === '') return;
        if (defaultMap[id] === undefined) {
          defaultMap[id] = true;
        }
      });

      return defaultMap;
    };
    setSelectedStateMachines(getDefaultValues());
  };

  const handleCheckedChange = (id: string) => {
    setSelectedStateMachines((selectedStateMachines) => {
      const isSelected = selectedStateMachines[id];
      if (isSelected === undefined) return selectedStateMachines;

      selectedStateMachines[id] = !isSelected;

      return { ...selectedStateMachines };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSubmit(selectedStateMachines);
    close();
  };

  return (
    <Modal
      onRequestClose={close}
      title="Выбор машин состояний для компиляции"
      isOpen={isOpen}
      onSubmit={handleSubmit}
    >
      <div className="flex">
        <div className="ml-10 mr-10 flex h-96 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {Object.entries(selectedStateMachines).map(([id, isSelected]) => {
            if (id === '') return;
            return (
              <div
                key={id}
                onClick={() => {
                  handleCheckedChange(id);
                }}
                className="flex cursor-pointer flex-col pl-2 pt-2 align-middle hover:bg-bg-hover"
              >
                <div className="flex flex-row ">
                  <Checkbox
                    onClick={() => {
                      handleCheckedChange(id);
                    }}
                    checked={isSelected}
                  />

                  <span className="ml-2">{stateMachines[id].name ?? id}</span>
                </div>
                <hr className="ml-2 mr-2 mt-2 h-[1px] w-auto border-bg-hover opacity-70" />
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
