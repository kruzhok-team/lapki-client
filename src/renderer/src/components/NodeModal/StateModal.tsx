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

    const { selectedComponent, selectedMethod, tabValue } = trigger;
    const triggerText = trigger.text.trim();

    // TODO(bryzZz) Нужно не просто не отправлять форму а показывать ошибки
    if (
      (tabValue === 0 && (!selectedComponent || !selectedMethod)) ||
      (tabValue === 1 && !triggerText)
      // || events.events.length === 0
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
        condition: getCondition(),
      },
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

      parseTrigger(eventData?.trigger);
      parseEvents(eventData?.do);
      parseCondition(eventData?.condition);

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

    parseEvents(stateEvents?.do);
    parseCondition(stateEvents?.condition);
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
