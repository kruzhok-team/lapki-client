import React, { useMemo } from 'react';

import { Modal } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action, EventData } from '@renderer/types/diagram';

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
  const trigger = useTrigger(smId, controller, true, event);
  const condition = useCondition(smId, controller, event?.condition);
  const actions = useActions(smId, controller, (event?.do as Action[] | undefined) ?? null);

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
      (actions.tabValue === 0 && actions.actions.length === 0) ||
      (actions.tabValue === 1 && !actions.text.trim())
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

    close();
  };

  const handleAfterClose = () => {
    trigger.clear();
    actions.clear();
    condition.clear();
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
      </div>
    </Modal>
  );
};
