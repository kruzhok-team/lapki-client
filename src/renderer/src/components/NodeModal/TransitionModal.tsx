import React, { useEffect, useMemo, useState } from 'react';

import { isEqual } from 'lodash';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { ChangeTransitionParams } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import {
  Action,
  Condition as ConditionData,
  Event,
  EventData,
  Transition,
} from '@renderer/types/diagram';

import { Actions, Condition, ColorField, Trigger } from './components';
import { useTrigger, useCondition, useActions } from './hooks';

interface TransitionModalProps {
  smId: string;
  controller: CanvasController;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({ smId, controller }) => {
  const modelController = useModelContext();
  const visual = controller.useData('visual');
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const choiceStates = modelController.model.useData(smId, 'elements.choiceStates');
  const transitions = modelController.model.useData(smId, 'elements.transitions') as {
    [id: string]: Transition;
  };
  const [error, setError] = useState<string | undefined>(undefined);
  const [isOpen, open, close] = useModal(false);
  const [transitionId, setTransitionId] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [newTransition, setNewTransition] = useState<{
    sourceId: string;
    targetId: string;
  } | null>();
  const [isInitialTransition, setIsInitialTransition] = useState<boolean>(false);

  // Данные формы
  const trigger = useTrigger(smId, controller, false, transition?.label?.trigger as Event | null);
  const condition = useCondition(smId, controller, transition?.label?.condition);
  const actions = useActions(smId, controller, (transition?.label?.do as Action[]) ?? []);
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
  }, [smId, controller, newTransition, transition]);

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
      setError(`Необходимо выбрать триггер ("Когда")!`);
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
      isElse,
    } = condition;

    //Проверка на наличие пустых блоков условия, если же они пустые, то форма не отправляется
    if (show && !isElse) {
      const errors = condition.checkForErrors();

      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    const getCondition = () => {
      if (!show) return undefined;

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

    const checkCondition = (newTransition: Transition, transitionId?: string) => {
      for (const [id, transition] of Object.entries(transitions)) {
        if (
          id === transitionId ||
          !transition.label ||
          transition.sourceId !== newTransition.sourceId
        )
          continue;

        const trigger = transition.label.trigger as Event | undefined;
        const condition = transition.label.condition as ConditionData | undefined;

        if (!trigger) continue;

        if (trigger.component === selectedComponent && trigger.method === selectedMethod) {
          const newCondition = getCondition() as ConditionData | undefined;
          if (isEqual(condition, newCondition)) {
            return `Переход на событие ${selectedComponent}.${selectedMethod} с таким условием уже существует!`;
          }
        }
      }
      return undefined;
    };
    const valueCondition = getCondition();
    if (!showTrigger && valueCondition === undefined) {
      setError('Необходимо указать условие!');
      return;
    }
    // Если редактируем состояние
    if (transition && transitionId) {
      const error = checkCondition(transition, transitionId);
      if (error) {
        setError(error);
        return;
      }
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
      const error = checkCondition(newTransition);
      if (error) {
        setError(error);
        return;
      }
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
    setError(undefined);
    setTransition(null);

    setTransitionId(null);
    setNewTransition(null);
    setIsInitialTransition(false);
  };

  // Подстановка начальных значений
  useEffect(() => {
    const handleCreateTransition = (data: { smId: string; sourceId: string; targetId: string }) => {
      if (data.smId !== smId || controller.id !== headControllerId) return;
      setNewTransition(data);
      actions.parse(data.smId, []);
      open();
    };

    const handleChangeTransition = (args: ChangeTransitionParams) => {
      /*
        Эта проверка здесь потому что у нас создаются инстансы модалки на каждую МС.
        Так как схемотехнический экран подписан на все машины состояний сразу, то
        модалки с его DiagramEditor всегда будут реагировать на openChangeTransitionModal.
        И, получается, что вызывается модалка как для specific канваса, так и для схемотехнического.
      */
      if (args.smId !== smId || controller.id !== headControllerId) return;

      trigger.parse(args.label?.trigger);
      condition.parse(args.label?.condition);
      actions.parse(args.smId, args.label?.do);

      setColor(args.color);

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
  }, [headControllerId, visual]); // костыль для того, чтобы при смене режима на текстовый парсеры работали верно

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
          {!isInitialTransition && showTrigger && (
            <Trigger event={(transition?.label as EventData) ?? null} {...trigger} />
          )}
          {!isInitialTransition && <Condition {...condition} />}
          {!isInitialTransition && (
            <Actions event={(transition?.label as EventData) ?? null} {...actions} />
          )}
          {error && <div className="text-error">{error}</div>}
          <ColorField label="Цвет линии:" value={color} onChange={setColor} />
        </div>
      </Modal>
    </>
  );
};
