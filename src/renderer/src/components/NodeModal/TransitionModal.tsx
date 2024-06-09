import React, { useEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { DEFAULT_TRANSITION_COLOR } from '@renderer/lib/constants';
import { operatorSet } from '@renderer/lib/data/PlatformManager';
import { ChoiceState, FinalState, State, Transition } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Variable as VariableData } from '@renderer/types/diagram';

import { Events, Condition, ColorField, Trigger } from './components';
import { useTrigger, useCondition, useEvents } from './hooks';

export const TransitionModal: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);

  const [transition, setTransition] = useState<Transition | null>(null);
  const [newTransition, setNewTransition] = useState<{
    source: State | ChoiceState;
    target: State | ChoiceState | FinalState;
  } | null>();

  // Данные формы
  const trigger = useTrigger(false);
  const condition = useCondition();
  const events = useEvents();
  const [color, setColor] = useState(DEFAULT_TRANSITION_COLOR);

  // Если создается новый переход и это переход из состояния выбора то показывать триггер не нужно
  const showTrigger = useMemo(() => {
    if (newTransition) {
      return !(newTransition.source instanceof ChoiceState);
    }

    if (transition) {
      return !(transition.source instanceof ChoiceState);
    }

    return true;
  }, [newTransition, transition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { selectedComponent, selectedMethod, tabValue } = trigger;
    const triggerText = trigger.text.trim();

    if (
      showTrigger &&
      ((tabValue === 0 && (!selectedComponent || !selectedMethod)) ||
        (tabValue === 1 && !triggerText))
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
    if (show) {
      const errors = condition.checkForErrors();

      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    const getCondition = () => {
      if (!show) return undefined;

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
      if (!showTrigger) return undefined;

      if (tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };

      return triggerText;
    };

    const getEvents = () => {
      if (events.tabValue === 0) {
        return events.events;
      }

      return events.text.trim() || undefined; // Чтобы при пустом текте возвращался undefined
    };

    // Если редактируем состояние
    if (transition) {
      editor.controller.transitions.changeTransition({
        id: transition.id,
        source: transition.data.source,
        target: transition.data.target,
        color,
        label: {
          trigger: getTrigger(),
          condition: getCondition(),
          do: getEvents(),
        },
      });

      close();
    }

    // Если создаем новое
    if (newTransition) {
      editor.controller.transitions.createTransition({
        source: newTransition.source.id,
        target: newTransition.target.id,
        color,
        label: {
          trigger: getTrigger(),
          condition: getCondition(),
          do: getEvents(),
        },
      });
    }

    close();
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.clear();
    condition.clear();
    events.clear();
    setColor(DEFAULT_TRANSITION_COLOR);

    setTransition(null);
    setNewTransition(null);
  };

  useEffect(() => {
    const handleCreateTransition = (data: {
      source: State | ChoiceState;
      target: State | ChoiceState | FinalState;
    }) => {
      setNewTransition(data);
      events.setEvents([]);
      open();
    };

    const handleChangeTransition = (target: Transition) => {
      const { data: initialData } = target;

      if (initialData.label?.trigger) {
        if (typeof initialData.label.trigger !== 'string') {
          trigger.setSelectedComponent(initialData.label.trigger.component);
          trigger.setSelectedMethod(initialData.label.trigger.method);
          trigger.onTabChange(0);
        } else {
          trigger.onChangeText(initialData.label.trigger);
          trigger.onTabChange(1);
        }
      }

      //Позволяет найти начальные значения условия(условий), если таковые имеются
      const parseCondition = () => {
        const c = initialData.label?.condition;
        if (!c) return undefined;
        condition.handleChangeConditionShow(true);

        if (typeof c === 'string') {
          condition.onTabChange(1);
          return condition.onChangeText(c);
        }

        condition.onTabChange(0);

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

      parseCondition();

      if (initialData.label?.do) {
        if (typeof initialData.label.do !== 'string') {
          events.setEvents(initialData.label.do);
          events.onTabChange(0);
        } else {
          events.onChangeText(initialData.label.do);
          events.onTabChange(1);
        }
      }

      setColor(initialData.color);

      setTransition(target);
      open();
    };

    editor.controller.transitions.on('createTransition', handleCreateTransition);
    editor.controller.transitions.on('changeTransition', handleChangeTransition);

    return () => {
      editor.controller.transitions.off('createTransition', handleCreateTransition);
      editor.controller.transitions.off('changeTransition', handleChangeTransition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Modal
        title="Редактор соединения"
        onSubmit={handleSubmit}
        isOpen={isOpen}
        onRequestClose={close}
        onAfterClose={handleAfterClose}
      >
        <div className="flex flex-col gap-4">
          {showTrigger && <Trigger {...trigger} />}
          <Condition {...condition} />
          <Events {...events} />
          <ColorField label="Цвет линии:" value={color} onChange={setColor} />
        </div>
      </Modal>
    </>
  );
};
