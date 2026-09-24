import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  getEventConflict,
  getUsedSystemMethods,
} from '@renderer/components/NodeModal/components/eventsHierarchyModel';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { systemComponent } from '@renderer/lib/data/PlatformManager';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action, Event, EventData } from '@renderer/types/diagram';

import { useActions } from './useActions';
import { useCondition } from './useCondition';
import { useTrigger } from './useTrigger';

export const useEditEvent = (
  smId: string,
  controller: CanvasController,
  state: State | null,
  event: EventData | null | undefined,
  currentEventIndex: number | undefined
) => {
  const modelController = useModelContext();

  const unavailableSystemMethods = getUsedSystemMethods(
    state?.data.events ?? [],
    currentEventIndex
  );
  const trigger = useTrigger(smId, controller, true, event?.trigger, unavailableSystemMethods);
  const condition = useCondition(smId, controller, event?.condition);
  const actions = useActions(smId, controller, event?.do ?? null);

  const [error, setError] = useState<string | undefined>(undefined);

  const { selectedComponent, selectedMethod } = trigger;

  const getTrigger = (): Event | string | undefined => {
    if (trigger.tabValue === 1) return trigger.text.trim() || undefined;
    if (!selectedComponent || !selectedMethod) return undefined;

    const currentTrigger = event?.trigger;
    const args =
      currentTrigger &&
      typeof currentTrigger !== 'string' &&
      currentTrigger.component === selectedComponent &&
      currentTrigger.method === selectedMethod
        ? currentTrigger.args
        : undefined;
    return { component: selectedComponent, method: selectedMethod, ...(args ? { args } : {}) };
  };

  // Проверка событий на конфликты
  const validateEventConflict = (): { type: 'error'; message: string } | undefined => {
    if (!state) return undefined;
    const newTrigger = getTrigger();
    if (!newTrigger) return undefined;

    const conflict = getEventConflict(state.data.events, currentEventIndex, {
      trigger: newTrigger,
      condition: getCondition(),
    });
    if (conflict === 'duplicate-system-trigger') {
      const method = typeof newTrigger === 'string' ? newTrigger : newTrigger.method;
      const signalName = systemComponent.signals[method]?.alias ?? method;
      return {
        type: 'error',
        message: `Системное событие «${signalName}» уже создано! Второй раз его создать нельзя.`,
      };
    }
    if (conflict === 'duplicate-condition') {
      return { type: 'error', message: 'У этого триггера уже есть такое условие.' };
    }
    if (conflict === 'mixed-condition') {
      return {
        type: 'error',
        message: 'У одного триггера не может быть одновременно условной и безусловной ветки.',
      };
    }
    return undefined;
  };

  const handleSubmit = (actionsOverride?: Action[]) => {
    if (!state) return;

    const triggerText = trigger.text.trim();

    if (
      (trigger.tabValue === 0 && (!selectedComponent || !selectedMethod)) ||
      (trigger.tabValue === 1 && !triggerText)
    ) {
      setError(`Необходимо выбрать триггер ("Когда")!`);
      return;
    }

    const conflict = validateEventConflict();
    if (conflict?.type === 'error') {
      setError(conflict.message);
      return;
    }

    //Проверка на наличие пустых блоков условия, если же они пустые, то форма не отправляется
    if (showCondition && show && !isElse) {
      const errors = condition.checkForErrors();
      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    const getActions = () =>
      actionsOverride ?? (actions.tabValue === 0 ? actions.actions : actions.text.trim());

    const getEvents = () => {
      const currentEvent = {
        trigger: getTrigger() as Event | string,
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

    modelController.changeState({ smId, id: state.id, events: getEvents() });
    toast.success('Событие сохранено!');
  };

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

  const showCondition = useMemo(
    () => trigger.selectedComponent !== 'System',
    [trigger.selectedComponent]
  );

  // Собирает условие в том же формате, в котором оно хранится в state.data.events, чтобы можно было сравнивать
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

  useEffect(() => {
    trigger.parse(event?.trigger);
    condition.parse(event?.condition);
    actions.parse(smId, event?.do ?? undefined);
    setError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  // Динамическая проверка конфликтов без нажатия кнопки сохранения
  useLayoutEffect(() => {
    const conflict = validateEventConflict();
    setError(conflict?.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedComponent,
    selectedMethod,
    show,
    isElse,
    isParamOneInput1,
    selectedComponentParam1,
    selectedMethodParam1,
    isParamOneInput2,
    selectedComponentParam2,
    selectedMethodParam2,
    argsParam1,
    argsParam2,
    conditionOperator,
    condition.tabValue,
    condition.text,
    trigger.tabValue,
    trigger.text,
  ]);

  const updateActions = (action: Action, idx: number | null) => {
    actions.setActions((prev) => {
      const next = [...prev];
      if (idx !== null) {
        next[idx] = action;
      } else {
        next.push(action);
      }
      return next;
    });
  };

  const getActions = () => actions.actions;

  return {
    event,
    showCondition,
    condition,
    trigger,
    actions,
    error,
    setError,
    validateEventConflict,
    handleSubmit,
    updateActions,
    getActions,
  };
};
