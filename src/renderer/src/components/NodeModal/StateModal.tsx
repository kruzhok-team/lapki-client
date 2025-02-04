import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useEditEventModal } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { serializeCondition, serializeEvent } from '@renderer/lib/data/GraphmlBuilder';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, Condition, Event as EventData } from '@renderer/types/diagram';
import { Platform } from '@renderer/types/platform';

import { Actions, ColorField, Trigger, Event } from './components';
import { EditEventModal } from './EditEventModal';
import { useTrigger, useActions, useCondition } from './hooks';

interface StateModalProps {
  smId: string;
  controller: CanvasController;
}

/**
 * Модальное окно редактирования состояния
 */
export const StateModal: React.FC<StateModalProps> = ({ smId, controller }) => {
  const modelController = useModelContext();
  // const visual = controller.useData('visual');
  const components = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const platforms = controller.useData('platform') as { [id: string]: PlatformManager };
  const platform = platforms[smId];
  const [isOpen, open, close] = useModal(false);
  const { openEditEventModal, props, closeEditEventModal } = useEditEventModal();
  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const [currentEventIndex, setCurrentEventIndex] = useState<number | undefined>();
  // const trigger = useTrigger(smId, controller, true);
  // const condition = useCondition(smId, controller);
  // const actions = useActions(smId, controller);
  const [color, setColor] = useState<string | undefined>();

  // const { parse: parseTrigger } = trigger;
  // const { parse: parseCondition } = condition;
  // const { parse: parseEvents } = actions;

  // // На дефолтные события нельзя ставить условия
  // const showCondition = useMemo(
  //   () => trigger.selectedComponent !== 'System',
  //   [trigger.selectedComponent]
  // );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openEditEventModal();
    // if (!state) return;
    // modelController.changeState({
    // smId: smId,
    // id: state.id,
    // events: getEvents(),
    // color,
    // });
    // close();
  };

  // // Сброс формы после закрытия
  const handleAfterClose = () => {
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
          <div className="ml-11 mr-11 h-96 w-auto overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {state &&
              state.data.events.map((event, key) => (
                <Event
                  key={key}
                  event={event.trigger as EventData}
                  isSelected={key === currentEventIndex}
                  platform={platform}
                  condition={event.condition as Condition}
                  text={`↳ ${serializeEvent(
                    components,
                    platform.data,
                    event.trigger as EventData
                  )}${getCondition(event.condition)}/`}
                  onClick={() => setCurrentEventIndex(key)}
                />
              ))}
          </div>
          <ColorField label="Цвет обводки:" value={color} onChange={setColor} />
        </div>
      </Modal>
      <EditEventModal
        isOpen={props.isEditEventModalOpen}
        close={closeEditEventModal}
        smId={smId}
        controller={controller}
      />
    </div>
  );
};
