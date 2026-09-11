import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { ParameterSelectOption } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { ArgList, Component, Action } from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';
import { formatArgType, validators } from '@renderer/utils';
import { getComponentAttribute } from '@renderer/utils/ComponentAttribute';

import { ActionsModalData } from '../ActionsModal';
import { useActions } from '../hooks/useActions';

export const useActionsModal = (
  smId: string,
  controller: CanvasController,
  idx?: number | null,
  onSubmit?: (data: Action, idx?: number | null) => void,
  initialData?: ActionsModalData
) => {
  const iconClassName = 'mr-1 h-5 w-5';
  const modelController = useModelContext();
  const model = modelController.model;
  const platforms = controller.useData('platform') as { [id: string]: PlatformManager };
  const visual = controller.useData('visual');
  const componentsData = model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const isEditingEvent = initialData?.isEditingEvent ?? false;

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [protoParameters, setProtoParameters] = useState<ArgumentProto[]>([]);
  const [parameters, setParameters] = useState<ArgList>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { getComponentOptions, getPropertyOptions } = useActions(smId, controller, null);

  const componentOptions: ParameterSelectOption[] = useMemo(() => {
    return getComponentOptions('methods', isEditingEvent, iconClassName);
  }, [smId, platforms, componentsData, isEditingEvent, visual]);

  const componentWithVariablesOptions: ParameterSelectOption[] = useMemo(() => {
    return getComponentOptions('variables', isEditingEvent, iconClassName);
  }, [smId, platforms, componentsData, isEditingEvent, visual]);

  const methodOptions: ParameterSelectOption[] = useMemo(() => {
    if (!selectedComponent) return [];
    return getPropertyOptions(
      selectedComponent,
      isEditingEvent ? 'signals' : 'methods',
      iconClassName
    );
  }, [selectedComponent, platforms, isEditingEvent, visual]);

  const attributeOptionsSearch = (selectedParameterComponent: string | null) => {
    if (!selectedParameterComponent) return [];
    return getPropertyOptions(selectedParameterComponent, 'variables', iconClassName);
  };

  // Функция обновления параметров при смене метода в селекте
  const updateParameters = (componentName: string | null, method: string | null) => {
    if (!componentName || !method || !controller.platform[smId]) return;

    let parameters: ArgList = {};

    // Этот блок нужен для того чтобы по возвращению на начальное состояние сбросить параметры до начального состояния а не очищать совсем)
    if (initialData) {
      if (initialData.action.component === componentName && initialData.action.method === method) {
        parameters = initialData.action.args ?? {};
      }
    }

    const componentProto = controller.platform[smId].getComponent(componentName);
    const componentProtoPath = isEditingEvent ? 'signals' : 'methods';
    const argumentProto = componentProto?.[componentProtoPath][method]?.parameters ?? [];

    setProtoParameters(argumentProto);
    setParameters(parameters);
    // Первоначальное создание объекта ошибок
    setErrors(
      argumentProto.reduce((acc, { name }) => {
        acc[name] = '';
        return acc;
      }, {})
    );
  };

  const handleComponentChange = (value: SingleValue<ParameterSelectOption>) => {
    setSelectedComponent(value?.value ?? null);
    setSelectedMethod(null);
    setProtoParameters([]);
    setParameters({});
    setErrors({});
  };

  const handleMethodChange = (value: SingleValue<ParameterSelectOption>) => {
    setSelectedMethod(value?.value ?? null);

    updateParameters(selectedComponent, value?.value ?? null);
  };

  const reset = useCallback(() => {
    setSelectedComponent(null);
    setSelectedMethod(null);
    setProtoParameters([]);
    setParameters({});
    setErrors({});
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const platform = controller.platform[smId];
    if (
      protoParameters
        .map((proto, i) => {
          const { name, type = '' } = proto;
          const parameter = parameters[name] ?? { value: '', order: i };
          const value = parameter.value;
          if (!proto.optional && (value === undefined || value === '')) {
            setErrors((p) => ({ ...p, [name]: `Обязательный параметр.` }));
            return false;
          }
          if (Array.isArray(value)) {
            return true;
          }
          const componentAttribute = getComponentAttribute(value, platform);
          if (componentAttribute) {
            if (!componentWithVariablesOptions.find((opt) => opt.value === componentAttribute[0])) {
              setErrors((p) => ({
                ...p,
                [name]: `Ошибка! Не удалось найти компонент с таким названием.`,
              }));
              return false;
            }
            if (componentAttribute[1] === '') {
              setErrors((p) => ({ ...p, [name]: `Выберите метод` }));
              return false;
            }
            const attributeOptions = attributeOptionsSearch(componentAttribute[0]);
            if (!attributeOptions.find((opt) => opt.value === componentAttribute[1])) {
              setErrors((p) => ({
                ...p,
                [name]: `Ошибка! Не удалось найти атрибут с таким названием.`,
              }));
              return false;
            }
          } else if (type && typeof type === 'string' && validators[type]) {
            if (!validators[type](value as string)) {
              setErrors((p) => ({ ...p, [name]: `Неправильный тип (${formatArgType(type)})` }));
              return false;
            } else {
              setErrors((p) => ({ ...p, [name]: '' }));
              return true;
            }
          }
          return true;
        })
        .some((value) => !value)
    ) {
      return;
    }
    if (!selectedComponent || !selectedMethod) return;
    onSubmit?.({ component: selectedComponent, method: selectedMethod, args: parameters }, idx);
    reset();
  };

  // Обработка начальных данных
  useLayoutEffect(() => {
    // Сброс всего если нет начальных данных, то есть когда создаём новое событие
    if (!initialData) {
      reset();
      return;
    }

    const init = (action: Action, path: 'signals' | 'methods') => {
      if (!platforms[smId]) return;

      const { component, method, args = {} } = action;
      const componentProto = platforms[smId].getComponent(component);
      const argumentProto = componentProto?.[path][method]?.parameters ?? [];

      setSelectedComponent(component);
      setSelectedMethod(method);
      setProtoParameters(argumentProto);
      setParameters(args);
      // Первоначальное создание объекта ошибок
      setErrors(
        argumentProto.reduce((acc, { name }) => {
          acc[name] = '';
          return acc;
        }, {})
      );
    };

    const { action, isEditingEvent: isEditingAction } = initialData;

    init(structuredClone(action), isEditingAction ? 'signals' : 'methods');
  }, [smId, controller, platforms, initialData, reset]);

  return {
    handleSubmit,
    handleComponentChange,
    handleMethodChange,
    componentOptions,
    methodOptions,
    selectedComponent,
    selectedMethod,
    protoParameters,
    parameters,
    setParameters,
    errors,
    setErrors,
    componentWithVariablesOptions,
    controller,
    smId,
    attributeOptionsSearch,
    reset,
  };
};
