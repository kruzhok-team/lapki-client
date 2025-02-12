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
    debugger;
    const getDefaultValues = () => {
      const defaultMap: { [id: string]: boolean } = {};
      Object.keys(stateMachines).map((id) => {
        if (defaultMap[id] === undefined) {
          defaultMap[id] = true;
        }
      });

      return defaultMap;
    };
    setSelectedStateMachines(getDefaultValues());
  }, [stateMachines]);

  const handleCheckedChange = (id: string) => {
    debugger;
    const isSelected = selectedStateMachines[id];
    if (isSelected === undefined) return;

    selectedStateMachines[id] = !isSelected;
    setSelectedStateMachines({ ...selectedStateMachines });
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
                onClick={(e) => {
                  debugger;
                  handleCheckedChange(id);
                }}
                className="flex flex-col pl-2 pt-2 align-middle hover:bg-bg-hover"
              >
                <div className="flex flex-row ">
                  <Checkbox
                    checked={isSelected}
                    onClick={(e) => {
                      debugger;
                      handleCheckedChange(id);
                    }}
                  />

                  <span className="ml-2">{stateMachines[id].name ?? id}</span>
                </div>
                <hr className="mt-2 h-[1px] w-auto border-bg-hover opacity-70" />
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
