import React, { useEffect, useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { DEFAULT_TRANSITION_COLOR } from '@renderer/lib/constants';
import { operatorSet } from '@renderer/lib/data/PlatformManager';
import { State, Transition } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Variable as VariableData } from '@renderer/types/diagram';

import { ColorField } from './ColorField';
import { Condition } from './Condition';
import { Events } from './Events';
import { useCondition } from './hooks/useCondition';
import { useEvents } from './hooks/useEvents';
import { useTrigger } from './hooks/useTrigger';
import { Trigger } from './Trigger';

export const TransitionModal: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);

  const [transition, setTransition] = useState<Transition | null>(null);
  const [newTransition, setNewTransition] = useState<{ source: State; target: State } | null>();

  // Данные формы
  const trigger = useTrigger(false);
  const condition = useCondition();
  const events = useEvents();
  const [color, setColor] = useState(DEFAULT_TRANSITION_COLOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { selectedComponent, selectedMethod, tabValue, text } = trigger;

    if ((tabValue === 0 && (!selectedComponent || !selectedMethod)) || (tabValue === 1 && !text)) {
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

      return condition.text;
    };

    const getTrigger = () => {
      if (tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };

      return text;
    };

    if (transition) {
      editor.controller.transitions.changeTransition({
        id: transition.id,
        source: transition.data.source,
        target: transition.data.target,
        color,
        label: {
          trigger: getTrigger(),
          condition: getCondition(),
          do: events.events,
        },
      });

      close();
    }

    if (newTransition) {
      editor.controller.transitions.createTransition({
        source: newTransition.source.id,
        target: newTransition.target.id,
        color,
        label: {
          trigger: getTrigger(),
          condition: getCondition(),
          do: events.events,
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
    editor.controller.transitions.on('changeTransition', (target) => {
      // if (editor.textMode) return;

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

      setColor(initialData.color);

      events.setEvents(target.data.label?.do ?? []);
      setTransition(target);
      open();
    });

    editor.controller.transitions.on('createTransition', ({ source, target }) => {
      setNewTransition({ source, target });
      events.setEvents([]);
      open();
    });
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
        <div className="flex flex-col gap-3">
          <Trigger {...trigger} />
          <Condition {...condition} />
          <Events {...events} />
          <ColorField value={color} onChange={setColor} />
        </div>
      </Modal>
    </>
  );
};
