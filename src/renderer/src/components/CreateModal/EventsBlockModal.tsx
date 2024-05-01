import React, { useLayoutEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { State, Transition } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Action, Event } from '@renderer/types/diagram';

interface EventsBlockModalProps {
  state: State | undefined;
  transition: Transition | undefined;
  selectedComponent: string | null;
  selectedMethod: string | null;
  events: Action[];
  setEvents: React.Dispatch<React.SetStateAction<Action[]>>;
  onOpenEventsModal: (event?: Event) => void;
  isOpen: boolean;
}

export const EventsBlockModal: React.FC<EventsBlockModalProps> = ({
  state,
  transition,
  selectedComponent,
  selectedMethod,
  events,
  setEvents,
  onOpenEventsModal,
  isOpen,
}) => {
  const editor = useEditorContext();

  const controller = editor.controller;

  //-----------------------------------------------------------------------------------------------------

  useLayoutEffect(() => {
    //Делаем проверку на наличие событий в состояниях
    const stateEvents = state?.eventBox.data.find(
      (value) =>
        selectedComponent === value.trigger.component && selectedMethod === value.trigger.method
    );

    if (state && stateEvents) {
      return setEvents(stateEvents.do);
    }
    if (transition && transition.data.label?.trigger) {
      if (
        transition.data.label.trigger.component === selectedComponent &&
        transition.data.label.trigger.method === selectedMethod
      ) {
        return setEvents(transition.data.label.do ?? []);
      }
    }
    return setEvents([]);
  }, [state, transition, isOpen, selectedComponent, selectedMethod]);

  const method: Action[] = events;
  //Срабатывания клика по элементу списка действий и удаление выбранного действия
  const [clickList, setClickList] = useState<number>(0);

  const deleteMethod = () => {
    const delMethod = method.filter((_value, index) => clickList !== index);
    setEvents(delMethod);
  };

  //Ниже реализовано перетаскивание событий между собой
  const [dragId, setDragId] = useState();
  const handleDrag = (id) => {
    setDragId(id);
  };

  const handleDrop = (id) => {
    const dragBox = method.find((_box, index) => index === dragId);
    const dropBox = method.find((_box, index) => index === id);

    if (!dragBox || !dropBox) return;

    const dragBoxOrder = dragBox;
    const dropBoxOrder = dropBox;

    const newBoxState = method.map((box, index) => {
      if (index === dragId) {
        box = dropBoxOrder;
      }
      if (index === id) {
        box = dragBoxOrder;
      }
      return box;
    });
    setEvents(newBoxState);
  };

  return (
    <div className="my-1 flex">
      <label className="mr-1 mt-2 font-bold">Делай: </label>
      <div className="ml-1 mr-2 flex h-44 w-full flex-col overflow-y-auto break-words rounded bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {method.length === 0 ||
          method.map((data, key) => (
            <div
              key={'Methods' + key}
              className={twMerge('flex hover:bg-bg-hover', clickList === key && 'bg-bg-active')}
              onClick={() => setClickList(key)}
              draggable={true}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => handleDrag(key)}
              onDrop={() => handleDrop(key)}
              onDoubleClick={() => onOpenEventsModal(data)}
            >
              <div
                className={twMerge(
                  'm-2 flex min-h-[3rem] w-36 items-center justify-around rounded-md bg-bg-primary px-1'
                )}
              >
                {controller.platform.getFullComponentIcon(data.component)}
                <div className="h-full w-[2px] bg-border-primary"></div>
                <img
                  style={{ height: '32px', width: '32px' }}
                  src={controller.platform.getActionIconUrl(data.component, data.method, true)}
                />
              </div>
              <div className="flex items-center">
                <div>{data.component}.</div>
                <div>{data.method}</div>
              </div>

              {data.args !== undefined || <div>{data.args}</div>}
            </div>
          ))}
        {method.length === 0 && <div className="mx-2 my-2 flex">(нет действий)</div>}
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" className="btn-secondary p-1" onClick={() => onOpenEventsModal()}>
          <AddIcon />
        </button>
        <button type="button" className="btn-secondary p-1" onClick={deleteMethod}>
          <SubtractIcon />
        </button>
      </div>
    </div>
  );
};
