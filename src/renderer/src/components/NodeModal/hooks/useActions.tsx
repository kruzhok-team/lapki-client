import { useCallback, useState } from 'react';

import { ParameterSelectOption } from '@renderer/components/UI';
import { serializeActions } from '@renderer/lib/data/GraphmlBuilder';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action, Component } from '@renderer/types/diagram';
import { getFilteredOptions } from '@renderer/utils';

export const useActions = (
  smId: string,
  controller: CanvasController,
  defaultActions: string | Action[] | null
) => {
  const modelController = useModelContext();
  const componentsData = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const visual = controller.useData('visual') as boolean;

  const [tabValue, setTabValue] = useState(0);

  const [actions, setActions] = useState<Action[]>(
    typeof defaultActions !== 'string' && defaultActions ? defaultActions : []
  );

  const [text, setText] = useState<string>(
    typeof defaultActions === 'string' ? defaultActions : ''
  );

  const handleDeleteAction = (index: number) => {
    setActions((p) => p.filter((_, i) => index !== i));
    // TODO(L140-beep) мб удалять и из модели сразу?
  };
  const handleReorderAction = (from: number, to: number) => {
    setActions((p) => {
      const newActions = [...p];

      [newActions[from], newActions[to]] = [newActions[to], newActions[from]];

      return newActions;
    });
  };

  const getComponentName = (id: string) => {
    const component = componentsData[id];
    if (!component) return id;

    return visual && component.name ? component.name : id;
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
    [controller, visual, componentsData] // зависимости для того, чтобы парсер в текстовом режиме работал корректно
  );

  const getComponentOption = (
    excludeIfEmpty: 'methods' | 'signals' | 'variables',
    id: string,
    className?: string
  ) => {
    if (!controller.platform[smId]) {
      return {
        value: id,
        label: id,
        hint: undefined,
        icon: undefined,
      };
    }
    const proto = controller.platform[smId]?.getComponent(id);

    if (proto && Object.keys(proto[excludeIfEmpty]).length === 0) {
      return;
    }

    const name =
      componentsData[id] && visual && componentsData[id].name ? componentsData[id].name : id;
    return {
      value: id,
      label: name,
      hint: proto?.description,
      icon: controller.platform[smId]?.getFullComponentIcon(id, className ?? 'mr-1 h-7 w-7'),
    };
  };

  const getComponentOptions = (
    excludeIfEmpty: 'methods' | 'signals' | 'variables',
    isEvent: boolean,
    className?: string
  ) => {
    if (!controller.platform[smId]) return [];

    const result = getFilteredOptions(
      (id: string) => getComponentOption(excludeIfEmpty, id, className),
      componentsData
    );

    if (isEvent) {
      const system = getComponentOption(excludeIfEmpty, 'System');
      if (system) {
        result.unshift(system);
      }
    }

    return result;
  };

  const getPropertyOptions = (
    component: string,
    type: 'methods' | 'signals' | 'variables',
    iconClassName?: string
  ): ParameterSelectOption[] => {
    if (!controller.platform[smId]) return [];
    const getAll =
      controller.platform[smId][
        type === 'methods'
          ? 'getAvailableMethods'
          : type === 'signals'
          ? 'getAvailableEvents'
          : 'getAvailableVariables'
      ];

    const getImg =
      controller.platform[smId][
        type === 'methods'
          ? 'getActionIconUrl'
          : type === 'signals'
          ? 'getEventIconUrl'
          : 'getVariableIconUrl'
      ];

    // Тут call потому что контекст теряется
    return getAll.call(controller.platform[smId], component).map(({ name, description, alias }) => {
      return {
        value: name,
        label: alias ?? name,
        hint: description,
        icon: (
          <img
            src={getImg.call(controller.platform[smId], component, name, true)}
            className={iconClassName ?? 'mr-1 h-5 w-5'}
          />
        ),
      };
    });
  };

  return {
    actions,
    setActions,

    onDeleteAction: handleDeleteAction,
    onReorderAction: handleReorderAction,

    tabValue,
    onTabChange: setTabValue,

    text,
    onChangeText: setText,

    smId,
    getComponentName,
    controller,
    parse,
    clear,
    getComponentOptions,
    getPropertyOptions,
  };
};
