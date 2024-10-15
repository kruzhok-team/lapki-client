import React, { useEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
// import { ChoiceState, FinalState, State, Transition } from '@renderer/lib/drawable';
import { ChangeTransitionParams } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { Transition } from '@renderer/types/diagram';

import { Actions, Condition, ColorField, Trigger } from './components';
import { useTrigger, useCondition, useActions } from './hooks';

interface TransitionModalProps {
  smId: string;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({ smId }) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const visual = modelController.controllers[headControllerId].useData('visual');
  // TODO: Передавать в модалки машину состояний
  // const sm = modelController.model.data.elements.stateMachines[smId];
  const choiceStates = modelController.model.useData(smId, 'elements.choiceStates');
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
  const actions = useActions();
  const [color, setColor] = useState<string | undefined>();

  // Если создается новый переход и это переход из состояния выбора то показывать триггер не нужно
  const showTrigger = useMemo(() => {
    if (newTransition) {
      return !choiceStates[newTransition.sourceId];
    }

    if (transition) {
      return !choiceStates[transition.sourceId];
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
        label: transition.label,
      });

      close();
      return;
    }

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

    const getActions = () => {
      if (actions.tabValue === 0) {
        return actions.actions;
      }

      return actions.text.trim() || undefined; // Чтобы при пустом текте возвращался undefined
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
          do: getActions(),
        } as any, // Из-за position,
      });
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
          do: getActions(),
        } as any, // Из-за position,
      });
    }
    close();
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.clear();
    condition.clear();
    actions.clear();
    setColor(undefined);

    setTransition(null);

    setTransitionId(null);
    setNewTransition(null);
    setIsInitialTransition(false);
  };

  // Подстановка начальных значений
  useEffect(() => {
    const handleCreateTransition = (data: { smId: string; sourceId: string; targetId: string }) => {
      if (data.smId !== smId) return;
      setNewTransition(data);
      actions.parse(data.smId, []);
      open();
    };

    const handleChangeTransition = (args: ChangeTransitionParams) => {
      if (args.smId !== smId) return;

      trigger.parse(args.label?.trigger);
      condition.parse(args.label?.condition);
      actions.parse(args.smId, args.label?.do);

      setColor(color);

      setTransition({ ...args });
      setTransitionId(args.id);
      setIsInitialTransition(args.label == undefined);
      open();
    };
    modelController.on('openCreateTransitionModal', handleCreateTransition);
    modelController.on('openChangeTransitionModal', handleChangeTransition);

    return () => {
      modelController.off('openCreateTransitionModal', handleCreateTransition);
      modelController.off('openChangeTransitionModal', handleChangeTransition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visual]); // костыль для того, чтобы при смене режима на текстовый парсеры работали верно

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
          {!isInitialTransition && <Actions {...actions} />}
          <ColorField label="Цвет линии:" value={color} onChange={setColor} />
        </div>
      </Modal>
    </>
  );
};
