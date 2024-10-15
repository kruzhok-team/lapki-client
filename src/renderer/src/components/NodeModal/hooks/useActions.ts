import { useCallback, useState } from 'react';

import { ActionsModalData } from '@renderer/components';
import { useModal } from '@renderer/hooks/useModal';
import { serializeActions } from '@renderer/lib/data/GraphmlBuilder';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action } from '@renderer/types/diagram';

export const useActions = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const stateMachines = Object.keys(controller.stateMachinesSub);
  // TODO: решить проблему с машинами состояний
  const smId = stateMachines[0];
  const componentsData = modelController.model.useData(smId, 'elements.components');
  const visual = controller.useData('visual');

  const [isActionsModalOpen, openActionsModal, closeActionsModal] = useModal(false);
  const [actionsModalData, setActionsModalData] = useState<ActionsModalData>();

  const [tabValue, setTabValue] = useState(0);

  const [actions, setActions] = useState<Action[]>([]);
  const [text, setText] = useState('');

  const handleAddAction = () => {
    setActionsModalData(undefined);
    openActionsModal();
  };
  const handleChangeAction = (action: Action) => {
    setActionsModalData(action && { action, isEditingEvent: false });
    openActionsModal();
  };
  const handleDeleteAction = (index: number) => {
    setActions((p) => p.filter((_, i) => index !== i));
  };
  const handleReorderAction = (from: number, to: number) => {
    setActions((p) => {
      const newActions = [...p];

      [newActions[from], newActions[to]] = [newActions[to], newActions[from]];

      return newActions;
    });
  };

  const handleActionsModalSubmit = (data: Action) => {
    if (actionsModalData) {
      setActions((p) => {
        const { component, method } = actionsModalData.action;
        const prevActionIndex = p.findIndex(
          (v) => v.component === component && v.method === method
        );

        if (prevActionIndex === -1) return p;

        const newActions = [...p];

        newActions[prevActionIndex] = data;

        return newActions;
      });
    } else {
      setActions((p) => [...p, data]);
    }

    closeActionsModal();
  };

  const clear = () => {
    setActions([]);
    setText('');
    setTabValue(0);
  };

  const parse = useCallback(
    (parseSmId: string, actionsToParse: Action[] | string | undefined) => {
      clear();

      if (!actionsToParse) return;

      if (typeof actionsToParse !== 'string') {
        setTabValue(0);
        if (!visual && controller.platform[parseSmId]) {
          setText(
            serializeActions(actionsToParse, componentsData, controller.platform[parseSmId].data)
          ); // для перехода в текст
        }
        return setActions(actionsToParse);
      }

      setTabValue(1);
      setText(actionsToParse);
    },
    [headControllerId, visual, componentsData] // зависимости для того, чтобы парсер в текстовом режиме работал корректно
  );

  return {
    actions,
    setActions,

    onAddAction: handleAddAction,
    onChangeAction: handleChangeAction,
    onDeleteAction: handleDeleteAction,
    onReorderAction: handleReorderAction,

    tabValue,
    onTabChange: setTabValue,

    text,
    onChangeText: setText,

    modal: {
      isOpen: isActionsModalOpen,
      onClose: closeActionsModal,
      onSubmit: handleActionsModalSubmit,
      initialData: actionsModalData,
    },

    parse,
    clear,
  };
};
