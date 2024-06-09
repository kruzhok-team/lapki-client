import React, { useEffect, useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { DEFAULT_STATE_COLOR } from '@renderer/lib/constants';
import { State } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';

import { Events, ColorField, Trigger } from './components';
import { useTrigger, useEvents } from './hooks';

export const StateModal: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);

  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const trigger = useTrigger(true);
  const events = useEvents();
  const [color, setColor] = useState(DEFAULT_STATE_COLOR);

  const { setEvents, onTabChange: onEventsTabChange, onChangeText: onEventsChangeText } = events;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state) return;

    const { selectedComponent, selectedMethod, tabValue } = trigger;
    const triggerText = trigger.text.trim();

    // TODO(bryzZz) Нужно не просто не отправлять форму а показывать ошибки
    if (
      (tabValue === 0 && (!selectedComponent || !selectedMethod)) ||
      (tabValue === 1 && !triggerText)
    ) {
      return;
    }

    const getTrigger = () => {
      if (tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };

      return triggerText;
    };

    const getEvents = () => {
      if (events.tabValue === 0) {
        return events.events;
      }

      return events.text.trim();
    };

    editor.controller.states.changeStateEvents({
      id: state.id,
      eventData: {
        trigger: getTrigger(),
        do: getEvents(),
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
    // Открытие окна и подстановка начальных данных формы на событие изменения состояния

    const handler = (state: State) => {
      const { data } = state;

      const eventData = data.events[0];
      if (eventData) {
        // Подстановка триггера, с переключение вкладок если он текстовый или выбранный
        if (typeof eventData.trigger !== 'string') {
          trigger.setSelectedComponent(eventData.trigger.component);
          trigger.setSelectedMethod(eventData.trigger.method);
          trigger.onTabChange(0);
        } else {
          trigger.onChangeText(eventData.trigger);
          trigger.onTabChange(1);
        }

        // Подставнока действией, тоже с переключение вкладок в зависимости от типа
        if (typeof eventData.do !== 'string') {
          events.setEvents(eventData.do);
          events.onTabChange(0);
        } else {
          events.onChangeText(eventData.do);
          events.onTabChange(1);
        }
      }

      setColor(data.color);

      setState(state);
      open();
    };

    editor.controller.states.on('changeState', handler);

    return () => {
      editor.controller.states.off('changeState', handler);
    };
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

    if (!stateEvents) return setEvents([]);

    if (typeof stateEvents.do === 'string') {
      onEventsChangeText(stateEvents.do);
      onEventsTabChange(1);
    } else {
      setEvents(stateEvents.do);
      onEventsTabChange(0);
    }
  }, [
    onEventsChangeText,
    onEventsTabChange,
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
        <ColorField label="Цвет обводки:" value={color} onChange={setColor} />
      </div>
    </Modal>
  );
};
