import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';

import { Events, ColorField, Trigger, Condition } from './components';
import { useTrigger, useEvents, useCondition } from './hooks';

export const StateModal: React.FC = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const smId = stateMachines[0];
  const editor = modelController.getCurrentCanvas();

  const [isOpen, open, close] = useModal(false);

  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const trigger = useTrigger(true);
  const condition = useCondition();
  const events = useEvents();
  const [color, setColor] = useState<string | undefined>();

  const { setEvents } = events;
  const { parseCondition } = condition;

  // На дефолтные события нельзя ставить условия
  const showCondition = useMemo(
    () => trigger.selectedComponent !== 'System',
    [trigger.selectedComponent]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state) return;

    const { selectedComponent, selectedMethod } = trigger;

    // TODO(bryzZz) Нужно не просто не отправлять форму а показывать ошибки
    if (!selectedComponent || !selectedMethod || events.events.length === 0) {
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
    };

    const getTrigger = () => {
      return { component: selectedComponent as string, method: selectedMethod as string };
    };

    const getEvents = () => {
      return events.events;
    };

    modelController.changeStateEvents({
      smId: smId,
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
    condition.clear();
    events.clear();
    setColor(undefined);

    setState(null);
  };

  useEffect(() => {
    // Открытие окна и подстановка начальных данных формы на событие изменения состояния

    const handler = (state: State) => {
      const { data } = state;

      const eventData = data.events[0];
      if (eventData) {
        // Подстановка триггера
        trigger.setSelectedComponent(eventData.trigger.component);
        trigger.setSelectedMethod(eventData.trigger.method);

        // Подставнока действией
        events.setEvents(eventData.do);
      }

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
      return (
        trigger.selectedComponent === value.trigger.component &&
        trigger.selectedMethod === value.trigger.method
      );
    });

    setEvents(stateEvents?.do ?? []);
    parseCondition(stateEvents?.condition);
  }, [parseCondition, setEvents, state, trigger.selectedComponent, trigger.selectedMethod]);

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
