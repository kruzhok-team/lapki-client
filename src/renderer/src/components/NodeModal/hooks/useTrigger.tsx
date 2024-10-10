import { useCallback, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { SelectOption } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component } from '@renderer/types/diagram';

/**
 * Инкапсуляция логики триггера формы {@link CreateModal}
 */
export const useTrigger = (addSystemComponents: boolean) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const smId = stateMachines[0];
  const componentsData = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const editor = modelController.getCurrentCanvas();
  const controller = editor.controller;

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const componentOptions: SelectOption[] = useMemo(() => {
    // Почему-то эта функция может вызываться раньше инициаилзации платформы
    // из-за чего возникают ошибки
    if (!controller.platform[smId]) {
      return [];
    }
    const getComponentOption = (id: string) => {
      if (!controller.platform[smId]) {
        return {
          value: id,
          label: id,
          hint: undefined,
          icon: undefined,
        };
      }
      const proto = controller.platform[smId]?.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: controller.platform[smId]?.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.entries(componentsData)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([idx]) => getComponentOption(idx));

    if (addSystemComponents) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, addSystemComponents, controller]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent || !controller.platform[smId]) return [];
    const getAll = controller.platform[smId]['getAvailableEvents'];
    const getImg = controller.platform[smId]['getEventIconUrl'];

    // Тут call потому что контекст теряется
    return getAll
      .call(controller.platform[smId], selectedComponent)
      .map(({ name, description }) => {
        return {
          value: name,
          label: name,
          hint: description,
          icon: (
            <img
              src={getImg.call(controller.platform[smId], selectedComponent, name, true)}
              className="mr-1 h-7 w-7 object-contain"
            />
          ),
        };
      });
  }, [controller, selectedComponent]);

  const handleComponentChange = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedComponent(value?.value ?? null);
    setSelectedMethod(null);
  }, []);

  const handleMethodChange = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedMethod(value?.value ?? null);
  }, []);

  const clear = useCallback(() => {
    setSelectedComponent(null);
    setSelectedMethod(null);
  }, []);

  return {
    componentOptions,
    methodOptions,

    selectedComponent,
    selectedMethod,
    onComponentChange: handleComponentChange,
    onMethodChange: handleMethodChange,
    setSelectedComponent,
    setSelectedMethod,

    clear,
  };
};
