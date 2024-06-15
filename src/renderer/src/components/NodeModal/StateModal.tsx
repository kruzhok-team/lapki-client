import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { State } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';

import { Events, ColorField, Trigger, Condition } from './components';
import { useTrigger, useEvents, useCondition } from './hooks';

export const StateModal: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);

  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const [currentEventIndex, setCurrentEventIndex] = useState<number | undefined>();
  const trigger = useTrigger(true);
  const condition = useCondition();
  const events = useEvents();
  const [color, setColor] = useState<string | undefined>();

  const { parse: parseTrigger } = trigger;
  const { parse: parseCondition } = condition;
  const { parse: parseEvents } = events;

  // На дефолтные события нельзя ставить условия
  const showCondition = useMemo(
    () => trigger.selectedComponent !== 'System',
    [trigger.selectedComponent]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state) return;

    const { selectedComponent, selectedMethod } = trigger;
    const triggerText = trigger.text.trim();

    // TODO(bryzZz) Нужно не просто не отправлять форму а показывать ошибки
    if (
      (trigger.tabValue === 0 && (!selectedComponent || !selectedMethod)) ||
      (trigger.tabValue === 1 && !triggerText)
    ) {
      return;
    }

    if (
      (events.tabValue === 0 && events.events.length === 0) ||
      (events.tabValue === 1 && !events.text.trim())
    ) {
      return;
    }

    const {
      show,
      isParamOneInput1,
      selectedComponentParam1,
      selectedMethodParam1,
      isParamOneInput2,
      selectedComponentParam2,
      selectedMethodParam2,
      argsParam1,
      argsParam2,
      conditionOperator,
    } = condition;

    //Проверка на наличие пустых блоков условия, если же они пустые, то форма не отправляется
    if (showCondition && show) {
      const errors = condition.checkForErrors();

      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    const getCondition = () => {
      if (!show || !showCondition) return undefined;

      if (condition.tabValue === 0) {
        // Тут много as string потому что проверка на null в checkForErrors
        return {
          type: conditionOperator as string,
          value: [
            {
              type: isParamOneInput1 ? 'component' : 'value',
              value: isParamOneInput1
                ? {
                    component: selectedComponentParam1 as string,
                    method: selectedMethodParam1 as string,
                    args: {},
                  }
                : (argsParam1 as string),
            },
            {
              type: isParamOneInput2 ? 'component' : 'value',
              value: isParamOneInput2
                ? {
                    component: selectedComponentParam2 as string,
                    method: selectedMethodParam2 as string,
                    args: {},
                  }
                : (argsParam2 as string),
            },
          ],
        };
      }

      return condition.text.trim() || undefined;
    };

    const getTrigger = () => {
      if (trigger.tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };

      return triggerText;
    };

    const getActions = () => {
      return events.tabValue === 0 ? events.events : events.text.trim();
    };

    const getEvents = () => {
      const currentEvent = {
        trigger: getTrigger(),
        condition: getCondition(),
        do: getActions(),
      };

      if (currentEventIndex !== undefined) {
        return state.data.events.map((e, i) => (i === currentEventIndex ? currentEvent : e));
      }

      return [...state.data.events, currentEvent];
    };

    editor.controller.states.changeState({
      id: state.id,
      events: getEvents(),
      // eventIndex: currentEventIndex,
      // eventData: {
      //   trigger: getTrigger(),
      //   do: getEvents(),
      //   condition: getCondition(),
      // },
      color,
    });

    close();
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.clear();
    events.clear();
    setColor(undefined);

    setState(null);
  };

  useEffect(() => {
    // Открытие окна и подстановка начальных данных формы на событие изменения состояния

    const handler = (state: State) => {
      const { data } = state;

      const eventData = data.events[0];

      // Остальная форма подставляется в эффекте синхронизации с trigger
      parseTrigger(eventData?.trigger);

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

  // Синхронизвация trigger и condition с event
  useLayoutEffect(() => {
    if (!state) return;

    const eventIndex = state.data.events.findIndex((value) => {
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

    if (eventIndex === -1) {
      setCurrentEventIndex(undefined);
      parseCondition(undefined);
      parseEvents(undefined);
    } else {
      const event = state.data.events[eventIndex];

      setCurrentEventIndex(eventIndex);
      parseCondition(event.condition);
      parseEvents(event.do);
    }
  }, [
    parseCondition,
    parseEvents,
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
        {showCondition && <Condition {...condition} />}
        <Events {...events} />
        <ColorField label="Цвет обводки:" value={color} onChange={setColor} />
      </div>
    </Modal>
  );
};
