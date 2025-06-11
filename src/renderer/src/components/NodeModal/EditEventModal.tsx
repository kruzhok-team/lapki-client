import React, { useMemo, useState } from 'react';

import { isEqual } from 'lodash';
import { toast } from 'sonner';

import { Modal } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { systemComponent } from '@renderer/lib/data/PlatformManager';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Event, EventData } from '@renderer/types/diagram';

import { Actions, Trigger, Condition } from './components';
import { useTrigger, useActions, useCondition } from './hooks';

interface EditEventModalProps {
  smId: string;
  controller: CanvasController;
  isOpen: boolean;
  close: () => void;
  state: State | null;
  event: EventData | null | undefined;
  currentEventIndex: number | undefined;
}

/**
 * Модальное окно редактирования состояния
 */
export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  close,
  event,
  smId,
  state,
  currentEventIndex,
  controller,
}) => {
  const modelController = useModelContext();

  // Данные формы
  const trigger = useTrigger(smId, controller, true, event?.trigger);
  const condition = useCondition(smId, controller, event?.condition);
  const actions = useActions(smId, controller, event?.do ?? null);
  const [error, setError] = useState<string | undefined>(undefined);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state) return;

    const { selectedComponent, selectedMethod } = trigger;
    const triggerText = trigger.text.trim();

    if (
      (trigger.tabValue === 0 && (!selectedComponent || !selectedMethod)) ||
      (trigger.tabValue === 1 && !triggerText)
    ) {
      setError(`Необходимо выбрать триггер ("Когда")!`);
      return;
    }

    if (trigger.tabValue === 0 && selectedComponent === 'System') {
      const duplicated = state.data.events.findIndex(
        (val) =>
          (val.trigger as unknown as Event).component === 'System' &&
          (val.trigger as unknown as Event).method === selectedMethod
      );
      if (duplicated !== -1 && currentEventIndex !== duplicated) {
        const signalName = selectedMethod
          ? systemComponent.signals[selectedMethod]?.alias ?? selectedMethod
          : selectedMethod;
        setError(`Cистемное событие «${signalName}» уже создано! Второй раз его создать нельзя.`);
        return;
      }
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
      isElse,
    } = condition;

    //Проверка на наличие пустых блоков условия, если же они пустые, то форма не отправляется
    if (showCondition && show && !isElse) {
      const errors = condition.checkForErrors();

      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    const getCondition = () => {
      if (!show || !showCondition) return undefined;
      if (isElse) return 'else';
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

    if (trigger.tabValue === 0) {
      for (const eventIdx in state.data.events) {
        if (currentEventIndex === Number(eventIdx)) continue;
        const event = state.data.events[eventIdx];
        const trigger = event.trigger;
        const condition = event.condition;
        if (
          typeof trigger !== 'string' &&
          trigger.component === selectedComponent &&
          trigger.method === selectedMethod
        ) {
          const newCondition = getCondition();
          if (isEqual(condition, newCondition)) {
            setError(
              `Событие ${selectedComponent}.${selectedMethod} с таким условием уже существует!`
            );
            return;
          }
        }
      }
    }

    const getTrigger = () => {
      if (trigger.tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };

      return triggerText;
    };

    const getActions = () => {
      return actions.tabValue === 0 ? actions.actions : actions.text.trim();
    };

    const getEvents = () => {
      const currentEvent = {
        trigger: getTrigger(),
        condition: getCondition(),
        do: getActions(),
      };
      if (currentEventIndex !== undefined && currentEventIndex >= state.data.events.length) {
        return [...state.data.events, currentEvent];
      }

      if (currentEventIndex !== undefined) {
        return state.data.events.map((e, i) => (i === currentEventIndex ? currentEvent : e));
      }

      return [...state.data.events, currentEvent];
    };
    modelController.changeState({
      smId: smId,
      id: state.id,
      events: getEvents(),
    });

    toast.success('Событие сохранено!');

    close();
  };

  const handleAfterClose = () => {
    trigger.clear();
    actions.clear();
    condition.clear();
    setError(undefined);
  };

  const showCondition = useMemo(
    () => trigger.selectedComponent !== 'System',
    [trigger.selectedComponent]
  );

  return (
    <Modal
      title={`Редактор события:`}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      onRequestClose={close}
      onAfterClose={handleAfterClose}
    >
      <div className="flex flex-col gap-3">
        <Trigger event={event} {...trigger} />
        {showCondition && <Condition {...condition} />}
        <Actions event={event} {...actions} />
        {error && <div className="text-error">{error}</div>}
      </div>
    </Modal>
  );
};
