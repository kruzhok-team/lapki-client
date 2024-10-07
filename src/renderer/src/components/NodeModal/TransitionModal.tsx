import React, { useEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
// import { ChoiceState, FinalState, State, Transition } from '@renderer/lib/drawable';
import { ChangeTransitionParams } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { Transition } from '@renderer/types/diagram';

import { Events, Condition, ColorField, Trigger } from './components';
import { useTrigger, useCondition, useEvents } from './hooks';

export const TransitionModal: React.FC = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const smId = stateMachines[0];
  const sm = modelController.model.data.elements.stateMachines[smId];
  const [isOpen, open, close] = useModal(false);
  const [transitionId, setTransitionId] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [newTransition, setNewTransition] = useState<{
    sourceId: string;
    targetId: string;
  } | null>();
  const [isInitialTransition, setIsInitialTransition] = useState<boolean>(false);

  // Данные формы
  const trigger = useTrigger(false);
  const condition = useCondition();
  const events = useEvents();
  const [color, setColor] = useState<string | undefined>();

  // Если создается новый переход и это переход из состояния выбора то показывать триггер не нужно
  const showTrigger = useMemo(() => {
    if (newTransition) {
      return !sm.choiceStates[newTransition.sourceId];
    }

    if (transition) {
      return !sm.choiceStates[transition.sourceId];
    }

    return true;
  }, [newTransition, transition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInitialTransition && transition && transitionId) {
      modelController.changeTransition({
        smId: smId,
        id: transitionId,
        sourceId: transition.sourceId,
        targetId: transition.targetId,
        color,
      });

      close();
      return;
    }

    const { selectedComponent, selectedMethod } = trigger;

    if (showTrigger && (!selectedComponent || !selectedMethod)) {
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
      if (!showTrigger) return undefined;

      return { component: selectedComponent as string, method: selectedMethod as string };
    };

    const getEvents = () => {
      return events.events;
    };

    // Если редактируем состояние
    if (transition && transitionId) {
      modelController.changeTransition({
        smId: smId,
        id: transitionId,
        sourceId: transition.sourceId,
        targetId: transition.targetId,
        color,
        label: {
          trigger: getTrigger(),
          condition: getCondition(),
          do: getEvents(),
        } as any, // Из-за position
      });

      close();
    }

    // Если создаем новое
    if (newTransition) {
      modelController.createTransition({
        smId: smId,
        sourceId: newTransition.sourceId,
        targetId: newTransition.targetId,
        color,
        label: {
          trigger: getTrigger(),
          condition: getCondition(),
          do: getEvents(),
        } as any, // Из-за position
      });
    }
    close();
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.clear();
    condition.clear();
    events.clear();
    setColor(undefined);

    setTransition(null);
    setTransitionId(null);
    setNewTransition(null);
    setIsInitialTransition(false);
  };

  useEffect(() => {
    const handleCreateTransition = (data: { sourceId: string; targetId: string }) => {
      setNewTransition(data);
      events.setEvents([]);
      open();
    };

    const handleChangeTransition = (args: ChangeTransitionParams) => {
      const { id, label, color } = args;
      if (label?.trigger) {
        trigger.setSelectedComponent(label.trigger.component);
        trigger.setSelectedMethod(label.trigger.method);
      }

      condition.parseCondition(label?.condition);

      if (label?.do) {
        events.setEvents(label.do);
      }

      setColor(color);

      setTransition({ ...args });
      setTransitionId(id);
      setIsInitialTransition(label == undefined);
      open();
    };
    modelController.on('openCreateTransitionModal', handleCreateTransition);
    modelController.on('changeTransition', handleChangeTransition);

    return () => {
      modelController.off('openCreateTransitionModal', handleCreateTransition);
      modelController.off('changeTransition', handleChangeTransition);
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
          {!isInitialTransition && showTrigger && <Trigger {...trigger} />}
          {!isInitialTransition && <Condition {...condition} />}
          {!isInitialTransition && <Events {...events} />}
          <ColorField label="Цвет линии:" value={color} onChange={setColor} />
        </div>
      </Modal>
    </>
  );
};
