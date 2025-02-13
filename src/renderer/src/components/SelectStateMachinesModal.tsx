import { useEffect, useLayoutEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { StateMachine } from '@renderer/types/diagram';
import { getDefaultSmSelection } from '@renderer/utils';

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
  const [selectedStateMachines, setSelectedStateMachines] = useState<{ [id: string]: boolean }>(
    getDefaultSmSelection(stateMachines, {})
  );
  const [isAllSelected, setIsAllSelected] = useState<boolean>(true);

  useLayoutEffect(() => {
    handleAfterClose();
  }, [stateMachines]);

  const handleAfterClose = () => {
    setSelectedStateMachines(getDefaultSmSelection(stateMachines, selectedStateMachines));
  };

  const handleCheckedChange = (e: React.MouseEvent, id: string) => {
    setSelectedStateMachines((selectedStateMachines) => {
      const isSelected = selectedStateMachines[id];
      if (isSelected === undefined) return selectedStateMachines;

      selectedStateMachines[id] = !isSelected;
      return { ...selectedStateMachines };
    });
    if (!selectedStateMachines[id]) {
      setIsAllSelected(false);
    } else {
      setIsAllSelected(Object.values(selectedStateMachines).every((value) => value));
    }
  };

  const unselectAll = (e: React.MouseEvent) => {
    setIsAllSelected(false);
    changeValues(false);
  };

  const changeValues = (value: boolean) => {
    setSelectedStateMachines((selectedStateMachines) => {
      for (const smId in selectedStateMachines) {
        selectedStateMachines[smId] = value;
      }
      return { ...selectedStateMachines };
    });
  };

  const selectAll = (e: React.MouseEvent) => {
    e.stopPropagation();

    changeValues(true);
    setIsAllSelected(true);
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
          <div className="event flex cursor-pointer flex-col p-3 pb-0 text-center align-middle hover:bg-bg-hover">
            <div className="flex flex-row">
              <Checkbox onClick={isAllSelected ? unselectAll : selectAll} checked={isAllSelected} />
              <span className="ml-2">Выбрать все</span>
            </div>
            <hr className="ml-2 mr-2 mt-2 h-[1px] w-auto border-bg-hover opacity-70" />
          </div>

          {Object.entries(selectedStateMachines).map(([id, isSelected]) => {
            if (id === '') return;
            return (
              <div
                key={id}
                className="event flex cursor-pointer flex-col p-3 pb-0 text-center align-middle hover:bg-bg-hover"
              >
                <div className="flex flex-row ">
                  <Checkbox
                    onClick={(e) => {
                      handleCheckedChange(e, id);
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
