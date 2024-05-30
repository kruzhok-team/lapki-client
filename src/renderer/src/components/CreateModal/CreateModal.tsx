import React, { useLayoutEffect, useRef, useState } from 'react';

import { Modal, ColorInput } from '@renderer/components/UI';
import { usePrevious } from '@renderer/hooks';
import { DEFAULT_STATE_COLOR, DEFAULT_TRANSITION_COLOR } from '@renderer/lib/constants';
import { operatorSet } from '@renderer/lib/data/PlatformManager';
import { State, Transition } from '@renderer/lib/drawable';
import {
  Action,
  Condition as ConditionData,
  Event,
  Event as StateEvent,
  Variable as VariableData,
} from '@renderer/types/diagram';

import { Condition } from './Condition';
import { EventsBlock } from './EventsBlock';
import { useCondition } from './hooks/useCondition';
import { useTrigger } from './hooks/useTrigger';
import { Trigger } from './Trigger';

export interface CreateModalResult {
  id: string;
  key: number;
  trigger: StateEvent | undefined;
  condition?: ConditionData;
  do: Action[];
  color?: string;
}

interface CreateModalProps {
  state: State | undefined;
  transition: Transition | undefined;
  events: Action[];
  showTrigger: boolean;
  setEvents: React.Dispatch<React.SetStateAction<Action[]>>;
  onOpenEventsModal: (event?: Event) => void;
  isOpen: boolean;
  onSubmit: (data: CreateModalResult) => void;
  onClose: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  state,
  transition,
  events,
  showTrigger,
  setEvents,
  onOpenEventsModal,
  isOpen,
  onSubmit,
  onClose,
}) => {
  const isEditingState = state !== undefined;

  const previousIsOpen = usePrevious(isOpen);
  // TODO(bryzZz) Костыль для того чтобы эффект, в котором подставляются первичные данные формы, работал только один раз на открытие
  // это уйдет после разделения на две модалки
  const onceOpenFlag = useRef(false);

  const [formState, setFormState] = useState<'submitted' | 'default'>('default');

  // Данные формы
  const trigger = useTrigger(isEditingState);
  const condition = useCondition({ isEditingState, formState });
  const [color, setColor] = useState(DEFAULT_TRANSITION_COLOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setFormState('submitted');

    const { selectedComponent, selectedMethod } = trigger;

    if (showTrigger && (!selectedComponent || !selectedMethod)) return;

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
    if (show) {
      const errors = condition.checkForErrors();

      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    const resultCondition = !show
      ? undefined
      : {
          type: conditionOperator!,
          value: [
            {
              type: isParamOneInput1 ? 'component' : 'value',
              value: isParamOneInput1
                ? {
                    component: selectedComponentParam1!,
                    method: selectedMethodParam1!,
                    args: {},
                  }
                : argsParam1!,
            },
            {
              type: isParamOneInput2 ? 'component' : 'value',
              value: isParamOneInput2
                ? {
                    component: selectedComponentParam2!,
                    method: selectedMethodParam2!,
                    args: {},
                  }
                : argsParam2!,
            },
          ],
        };

    const resultTrigger =
      selectedComponent && selectedMethod
        ? { component: selectedComponent, method: selectedMethod }
        : undefined;

    const data: CreateModalResult = {
      id: isEditingState ? state.id : '',
      key: isEditingState ? 2 : 3,
      trigger: resultTrigger,
      condition: resultCondition,
      do: events,
      color: color,
    };

    if ((state && events.length !== 0) || state === undefined) {
      onSubmit(data);
    }
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.setSelectedComponent(null);
    trigger.setSelectedMethod(null);

    condition.setSelectedComponentParam1('');
    condition.setSelectedComponentParam2('');
    condition.setArgsParam1('');
    condition.setConditionOperator('');
    condition.setSelectedMethodParam1('');
    condition.setSelectedMethodParam2('');
    condition.setArgsParam2('');
    condition.handleChangeConditionShow(false);
    condition.handleParamOneInput1(true);
    condition.handleParamOneInput2(true);
    condition.setErrors({});

    setColor(DEFAULT_TRANSITION_COLOR);

    setFormState('default');

    onceOpenFlag.current = false;
  };

  // Обработка начальных данных во время открытия модалки
  useLayoutEffect(() => {
    // Если закрыли модалку, то ничего не делаем
    // TODO(bryzZz) Любимые костылечки, опять же, это уйдет после разделения на две модалки
    if (previousIsOpen === undefined || (!isOpen && previousIsOpen) || onceOpenFlag.current) return;

    onceOpenFlag.current = true;

    if (isEditingState) {
      if (!state || state.data.events.length === 0) return;

      const { data } = state;

      setColor(data.color ?? DEFAULT_STATE_COLOR);
      trigger.setSelectedComponent(data.events[0].trigger.component);
      trigger.setSelectedMethod(data.events[0].trigger.method);

      return;
    }

    //Позволяет найти начальные значения условия(условий), если таковые имеются
    const tryGetCondition = () => {
      if (!transition) return;
      const c = transition.data.label?.condition;
      if (!c) return undefined;
      condition.handleChangeConditionShow(true);
      const operator = c.type;
      if (!operatorSet.has(operator) || !Array.isArray(c.value) || c.value.length != 2) {
        console.warn('👽 got condition from future (not comparsion)', c);
        return undefined;
      }
      const param1 = c.value[0];
      const param2 = c.value[1];
      if (Array.isArray(param1.value) || Array.isArray(param2.value)) {
        console.warn('👽 got condition from future (non-value operands)', c);
        return undefined;
      }

      if (
        param1.type == 'value' &&
        (typeof param1.value === 'string' || typeof param1.value === 'number')
      ) {
        condition.handleParamOneInput1(false);
        condition.setArgsParam1(param1.value);
      } else if (param1.type == 'component') {
        const compoName = (param1.value as VariableData).component;
        const methodName = (param1.value as VariableData).method;
        condition.handleParamOneInput1(true);
        condition.setSelectedComponentParam1(compoName);
        condition.setSelectedMethodParam1(methodName);
        //eventVar1 = [compoEntry(compoName), conditionEntry(methodName, compoName)];
      } else {
        console.warn('👽 got condition from future (strange operand 1)', c);
        return undefined;
      }

      if (
        param2.type == 'value' &&
        (typeof param2.value === 'string' || typeof param2.value === 'number')
      ) {
        condition.handleParamOneInput2(false);
        condition.setArgsParam2(param2.value);
      } else if (param2.type == 'component') {
        const compoName = (param2.value as VariableData).component;
        const methodName = (param2.value as VariableData).method;
        condition.handleParamOneInput2(true);
        condition.setSelectedComponentParam2(compoName);
        condition.setSelectedMethodParam2(methodName);
      } else {
        console.warn('👽 got condition from future (strange operand 2)', c);
        return undefined;
      }
      return condition.setConditionOperator(operator);
    };

    if (!transition) return;

    const { data } = transition;

    if (data.label?.trigger) {
      trigger.setSelectedComponent(data.label.trigger.component);
      trigger.setSelectedMethod(data.label.trigger.method);
    }

    setColor(data?.color ?? DEFAULT_TRANSITION_COLOR);

    tryGetCondition();

    return;
  }, [isOpen, previousIsOpen, state, transition, isEditingState, trigger, condition]);

  return (
    <Modal
      title={isEditingState ? `Редактор состояния: ${state?.data.name}` : 'Редактор соединения'}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      onRequestClose={onClose}
      onAfterClose={handleAfterClose}
    >
      {showTrigger && <Trigger {...trigger} />}

      {!isEditingState && <Condition {...condition} />}

      <EventsBlock
        state={state}
        transition={transition}
        selectedComponent={trigger.selectedComponent}
        selectedMethod={trigger.selectedMethod}
        events={events}
        setEvents={setEvents}
        onOpenEventsModal={onOpenEventsModal}
        isOpen={isOpen}
      />

      <div className="flex items-center gap-2">
        <span className="font-bold">Цвет:</span>
        <ColorInput value={color} onChange={setColor} />
      </div>
    </Modal>
  );
};
