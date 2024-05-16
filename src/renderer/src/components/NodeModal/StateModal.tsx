import React, { useEffect, useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { DEFAULT_STATE_COLOR } from '@renderer/lib/constants';
import { State } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';

import { ColorField } from './ColorField';
import { Events } from './Events';
import { useEvents } from './hooks/useEvents';
import { useTrigger } from './hooks/useTrigger';
import { Trigger } from './Trigger';

export const StateModal: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);

  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const trigger = useTrigger(true);
  const events = useEvents();
  const [color, setColor] = useState(DEFAULT_STATE_COLOR);

  const { setEvents } = events;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state) return;

    const { selectedComponent, selectedMethod, tabValue, text } = trigger;

    if ((tabValue === 0 && (!selectedComponent || !selectedMethod)) || (tabValue === 1 && !text)) {
      return;
    }

    const getTrigger = () => {
      if (tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };

      return text;
    };

    editor.controller.states.changeStateEvents({
      id: state.id,
      eventData: {
        trigger: getTrigger(),
        do: events.events,
      },
      color,
    });

    close();
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.clear();
    events.clear();
    setColor(DEFAULT_STATE_COLOR);

    setState(null);
  };

  useEffect(() => {
    editor.controller.states.on('changeState', (state) => {
      const { data } = state;

      const { data: initialData } = state;
      const eventData = initialData.events[0];

      if (eventData) {
        if (typeof eventData.trigger !== 'string') {
          trigger.setSelectedComponent(eventData.trigger.component);
          trigger.setSelectedMethod(eventData.trigger.method);
          trigger.onTabChange(0);
        } else {
          trigger.onChangeText(eventData.trigger);
          trigger.onTabChange(1);
        }

        events.setEvents(eventData.do ?? []);
      }

      setColor(data.color);

      setState(state);
      open();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Синхронизвация trigger и event
  useLayoutEffect(() => {
    if (!state) return;

    const stateEvents = state.data.events.find((value) => {
      if (trigger.tabValue === 1) {
        return value.trigger === trigger.text;
      }

      if (typeof value.trigger !== 'string') {
        return (
          trigger.selectedComponent === value.trigger.component &&
          trigger.selectedMethod === value.trigger.method
        );
      }

      return false;
    });

    if (stateEvents) {
      return setEvents(stateEvents.do);
    }

    return setEvents([]);
  }, [
    setEvents,
    state,
    trigger.selectedComponent,
    trigger.selectedMethod,
    trigger.tabValue,
    trigger.text,
  ]);

  return (
    <Modal
      title={`Редактор состояния: ${state?.data.name}`}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      onRequestClose={close}
      onAfterClose={handleAfterClose}
    >
      <div className="flex flex-col gap-3">
        <Trigger {...trigger} />
        <Events {...events} />
        <ColorField value={color} onChange={setColor} />
      </div>
    </Modal>
  );
};
