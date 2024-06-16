import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { EventsModal } from '@renderer/components';
import { useEditorContext } from '@renderer/store/EditorContext';

import { useEvents } from '../hooks';

type EventsProps = ReturnType<typeof useEvents>;

export const Events: React.FC<EventsProps> = (props) => {
  const { events, onAddEvent, onChangeEvent, onDeleteEvent, onReorderEvent, modal } = props;

  const editor = useEditorContext();

  const controller = editor.controller;

  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDrag = (index: number) => setDragIndex(index);

  const handleDrop = (index: number) => {
    if (dragIndex === null) return;

    onReorderEvent(dragIndex, index);
  };

  const handleClickDelete = () => {
    if (selectedEventIndex === null) return;

    onDeleteEvent(selectedEventIndex);
  };

  return (
    <div>
      <div className="mb-2 flex items-end gap-2">
        <p className="text-lg font-bold">Делай</p>
      </div>

      <div className="pl-4">
        <div className="flex gap-2">
          <div className="flex h-44 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {events.length === 0 && <div className="mx-2 my-2 flex">(нет действий)</div>}

            {events.map((data, i) => (
              <div
                key={i}
                className={twMerge(
                  'flex hover:bg-bg-hover',
                  selectedEventIndex === i && 'bg-bg-active'
                )}
                onClick={() => setSelectedEventIndex(i)}
                draggable
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => handleDrag(i)}
                onDrop={() => handleDrop(i)}
                onDoubleClick={() => onChangeEvent(data)}
              >
                <div
                  className={twMerge(
                    'm-2 flex min-h-[3rem] w-36 items-center justify-around rounded-md bg-bg-primary px-1'
                  )}
                >
                  {controller.platform!.getFullComponentIcon(data.component)}
                  <div className="h-full w-[2px] bg-border-primary"></div>
                  <img
                    style={{ height: '32px', width: '32px' }}
                    src={controller.platform!.getActionIconUrl(data.component, data.method, true)}
                  />
                </div>
                <div className="flex items-center">
                  <div>{data.component}.</div>
                  <div>{data.method}</div>
                </div>

                {data.args !== undefined || <div>{data.args}</div>}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" className="btn-secondary p-1" onClick={onAddEvent}>
              <AddIcon />
            </button>
            <button type="button" className="btn-secondary p-1" onClick={handleClickDelete}>
              <SubtractIcon />
            </button>
          </div>
        </div>
      </div>

      <EventsModal {...modal} />
    </div>
  );
};
