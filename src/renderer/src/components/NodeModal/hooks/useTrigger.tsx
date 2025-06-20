import { useCallback, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { SelectOption } from '@renderer/components/UI';
import { serializeEvent } from '@renderer/lib/data/GraphmlBuilder';
import { variableRegex } from '@renderer/lib/data/GraphmlParser';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { systemComponent } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, Event } from '@renderer/types/diagram';
import { getFilteredOptions } from '@renderer/utils';

/**
 * Инкапсуляция логики триггера формы {@link CreateModal}
 */
export const useTrigger = (
  smId: string,
  controller: CanvasController,
  addSystemComponents: boolean,
  event: string | Event | null | undefined
) => {
  const modelController = useModelContext();
  const componentsData = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };

  const visual = controller.useData('visual');

  const [tabValue, setTabValue] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    typeof event !== 'string' && event ? event.component : null
  );

  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    typeof event !== 'string' && event ? event.method : null
  );

  const [text, setText] = useState('');

  const componentOptions: SelectOption[] = useMemo(() => {
    // Почему-то эта функция может вызываться раньше инициализации платформы
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

      if (proto && Object.keys(proto.signals).length === 0) {
        return;
      }

      const name = !visual
        ? id
        : id === 'System'
        ? systemComponent.name
        : componentsData[id]?.name ?? id;
      return {
        value: id,
        label: name,
        hint: proto?.description,
        icon: controller.platform[smId]?.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = getFilteredOptions(getComponentOption, componentsData);
    if (addSystemComponents) {
      const system = getComponentOption('System');
      if (system) {
        result.unshift(system);
      }
    }

    return result;
  }, [smId, controller, componentsData, addSystemComponents, controller.platform, visual]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent || !controller.platform[smId]) return [];
    const getAll = controller.platform[smId]['getAvailableEvents'];
    const getImg = controller.platform[smId]['getEventIconUrl'];

    // Тут call потому что контекст теряется
    return getAll
      .call(controller.platform[smId], selectedComponent)
      .map(({ name, description, alias }) => {
        return {
          value: name,
          label: alias ?? name,
          hint: description,
          icon: (
            <img
              src={getImg.call(controller.platform[smId], selectedComponent, name, true)}
              className="mr-1 h-7 w-7 object-contain"
            />
          ),
        };
      });
  }, [smId, controller, selectedComponent]);

  const handleComponentChange = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedComponent(value?.value ?? null);
    setSelectedMethod(null);
  }, []);

  const handleMethodChange = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedMethod(value?.value ?? null);
    // debugger;
    // if (!visual && controller.platform[smId] && selectedComponent && value?.value)
    //   setText(
    //     serializeEvent(componentsData, controller.platform[smId].data, {
    //       component: selectedComponent,
    //       method: value?.value,
    //     })
    //   ); // для перехода в текст
  }, []);

  const clear = useCallback(() => {
    setSelectedComponent(null);
    setSelectedMethod(null);
    setText('');
    setTabValue(0);
  }, []);

  const parse = useCallback(
    (triggerToParse: Event | string | undefined) => {
      clear();
      if (!triggerToParse) return;

      if (typeof triggerToParse !== 'string') {
        setSelectedComponent(triggerToParse.component);
        setSelectedMethod(triggerToParse.method);
        if (!visual && controller.platform[smId])
          setText(serializeEvent(componentsData, controller.platform[smId].data, triggerToParse)); // для перехода в текст
        return setTabValue(0);
      }
      const parsedTrigger = variableRegex.exec(triggerToParse)?.groups;
      if (parsedTrigger) {
        setSelectedComponent(parsedTrigger['component']);
        setSelectedMethod(parsedTrigger['method']);
      } else {
        setTabValue(1);
      }
      setText(triggerToParse);
    },
    [clear, visual] // visual для того, чтобы при смене режима парсер работал корректно
  );

  return {
    componentOptions,
    methodOptions,

    tabValue,
    onTabChange: setTabValue,

    text,
    onChangeText: setText,

    selectedComponent,
    selectedMethod,
    onComponentChange: handleComponentChange,
    onMethodChange: handleMethodChange,
    setSelectedComponent,
    setSelectedMethod,
    smId,
    controller,
    parse,
    clear,
  };
};
