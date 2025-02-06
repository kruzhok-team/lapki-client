import React, { useEffect, useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Modal } from '@renderer/components/UI';
import { useEditEventModal } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { serializeCondition, serializeEvent } from '@renderer/lib/data/GraphmlBuilder';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, Condition, Event, EventData } from '@renderer/types/diagram';

import { ColorField, Event as EventPicto } from './components';
import { EditEventModal } from './EditEventModal';

interface StateModalProps {
  smId: string;
  controller: CanvasController;
}

/**
 * Модальное окно редактирования состояния
 */
export const StateModal: React.FC<StateModalProps> = ({ smId, controller }) => {
  const modelController = useModelContext();
  const components = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  modelController.model.useData(smId, 'elements.states');
  const platforms = controller.useData('platform') as { [id: string]: PlatformManager };
  const platform = platforms[smId];
  const [isOpen, open, close] = useModal(false);
  const { openEditEventModal, props, closeEditEventModal } = useEditEventModal();
  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const [currentEventIndex, setCurrentEventIndex] = useState<number | undefined>();
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [color, setColor] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openEditEventModal();
  };

  // // Сброс формы после закрытия
  const handleAfterClose = () => {
    if (state) {
      modelController.changeState({
        ...state.data,
        color: color,
        smId,
        id: state.id,
      });
    }
    setColor(undefined);

    setState(null);
    close();
  };

  // Открытие окна и подстановка начальных данных формы на событие изменения состояния
  useEffect(() => {
    const handler = (state: State) => {
      const { data } = state;

      // const eventData = data.events[0];

      // Остальная форма подставляется в эффекте синхронизации с trigger
      // parseTrigger(eventData?.trigger);

      setColor(data.color);

      setState(state);
      open();
    };

    controller.states.on('changeState', handler);

    return () => {
      controller.states.off('changeState', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // костыль для того, чтобы при смене режима на текстовый парсеры работали верно

  const addEvent = () => {
    if (!state) return;

    setCurrentEventIndex(state.data.events.length);
    setCurrentEvent({ trigger: { component: 'System', method: 'onEnter' }, do: [] });
    openEditEventModal();
  };

  const removeEvent = () => {
    if (!state || currentEventIndex === undefined) return;

    const getEvents = () => {
      if (state.data.events.length === 1) {
        return [];
      }
      return [
        ...state.data.events.slice(0, currentEventIndex),
        ...state.data.events.slice(currentEventIndex + 1, state.data.events.length),
      ];
    };

    modelController.changeState({ smId: smId, id: state.id, events: getEvents() }, true);
    setCurrentEventIndex(undefined);
  };

  const getCondition = (condition: string | Condition | undefined) => {
    if (!condition) return '';
    if (typeof condition === 'string') return `[${condition}]`;

    return `[${serializeCondition(condition, platform.data, components)}]`;
  };

  return (
    <div>
      <Modal
        title={`Редактор состояния: ${state?.data.name}`}
        onSubmit={handleSubmit}
        submitLabel="Редактировать"
        isOpen={isOpen}
        onRequestClose={close}
        submitDisabled={currentEventIndex === undefined}
        onAfterClose={handleAfterClose}
      >
        <div className="flex flex-col gap-3">
          <div className="flex">
            <div
              onDoubleClick={addEvent}
              className="ml-11 mr-3 h-96 w-full overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
            >
              {state &&
                (state.data.events.length === 0 ? (
                  <div className="flex h-full w-full select-none flex-row items-center justify-center text-center align-middle text-text-inactive">
                    <span className="mr-2">Чтобы добавить событие, нажмите</span>
                    <div>
                      <AddIcon className="btn-secondary h-5 w-5 cursor-default border-text-inactive p-[0.5px]" />
                    </div>
                  </div>
                ) : (
                  state.data.events.map((event, key) => (
                    <EventPicto
                      onDoubleClick={() => openEditEventModal()}
                      key={key}
                      event={event.trigger as Event}
                      isSelected={key === currentEventIndex}
                      platform={platform}
                      condition={event.condition as Condition}
                      text={`↳ ${serializeEvent(
                        components,
                        platform.data,
                        event.trigger as Event
                      )}${getCondition(event.condition)}/`}
                      onClick={() => {
                        setCurrentEventIndex(key);
                        setCurrentEvent(state.data.events[key]);
                      }}
                    />
                  ))
                ))}
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className="btn-secondary border-red p-1" onClick={addEvent}>
                <AddIcon />
              </button>
              <button
                type="button"
                className="btn-secondary p-1"
                onClick={removeEvent}
                disabled={currentEventIndex === undefined}
              >
                <SubtractIcon />
              </button>
            </div>
          </div>
          <ColorField label="Цвет обводки:" value={color} onChange={setColor} />
        </div>
      </Modal>
      <EditEventModal
        isOpen={props.isEditEventModalOpen}
        close={() => {
          closeEditEventModal();
          setCurrentEventIndex(undefined);
        }}
        smId={smId}
        state={state}
        currentEventIndex={currentEventIndex}
        event={currentEvent}
        controller={controller}
      />
    </div>
  );
};
