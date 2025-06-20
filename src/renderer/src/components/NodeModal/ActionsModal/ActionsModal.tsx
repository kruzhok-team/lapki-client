import React, { useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { Modal, Select, SelectOption } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { ArgList, Component, Action } from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';
import { formatArgType, validators } from '@renderer/utils';
import { getComponentAttribute } from '@renderer/utils/ComponentAttribute';

import { ActionsModalParameters } from './ActionsModalParameters';

import { useActions } from '../hooks/useActions';

export interface ActionsModalData {
  smId: string;
  action: Action;
  isEditingEvent: boolean;
}

interface ActionsModalProps {
  smId: string;
  controller: CanvasController;
  initialData?: ActionsModalData;
  isOpen: boolean;
  idx: number | null;
  onSubmit: (data: Action, idx?: number | null) => void;
  onClose: () => void;
}

export const ActionsModal: React.FC<ActionsModalProps> = ({
  initialData,
  onSubmit,
  controller,
  smId,
  isOpen,
  onClose,
  idx,
}) => {
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

  const componentOptions: SelectOption[] = useMemo(() => {
    return getComponentOptions('methods', isEditingEvent);
  }, [smId, platforms, componentsData, isEditingEvent, visual]);

  const componentWithVariablesOptions: SelectOption[] = useMemo(() => {
    return getComponentOptions('variables', isEditingEvent);
  }, [smId, platforms, componentsData, isEditingEvent, visual]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent) return [];
    return getPropertyOptions(selectedComponent, isEditingEvent ? 'signals' : 'methods');
  }, [selectedComponent, platforms, isEditingEvent, visual]);

  const attributeOptionsSearch = (selectedParameterComponent: string | null) => {
    if (!selectedParameterComponent) return [];
    return getPropertyOptions(selectedParameterComponent, 'variables');
  };

  // Функция обновления параметров при смене метода в селекте
  const updateParameters = (componentName: string | null, method: string | null) => {
    if (!componentName || !method || !controller.platform[smId]) return;

    let parameters: ArgList = {};

    // Этот блок нужен для то чтобы по возвращению на начальное состояние сбросить параметры до начального состояния а не очищать совсем)
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

  const handleComponentChange = (value: SingleValue<SelectOption>) => {
    setSelectedComponent(value?.value ?? null);
    setSelectedMethod(null);
    setProtoParameters([]);
    setParameters({});
    setErrors({});
  };

  const handleMethodChange = (value: SingleValue<SelectOption>) => {
    setSelectedMethod(value?.value ?? null);

    updateParameters(selectedComponent, value?.value ?? null);
  };

  const reset = () => {
    setSelectedComponent(null);
    setSelectedMethod(null);
    setProtoParameters([]);
    setParameters({});
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Для работы модалки внутри модалки, чтобы не отправлять родительскую форму

    const platform = controller.platform[smId];
    if (
      protoParameters
        .map((proto, idx) => {
          const { name, type = '' } = proto;
          const parameter = parameters[name] ?? { value: '', order: idx };
          const value = parameter.value;
          if (!proto.optional && (value === undefined || value === '')) {
            setErrors((p) => ({
              ...p,
              [name]: `Обязательный параметр.`,
            }));
            return false;
          }
          if (Array.isArray(value)) {
            return true;
          }
          const componentAttribute = getComponentAttribute(value, platform);
          if (componentAttribute) {
            // существует ли компонент с таким названием
            if (
              !componentWithVariablesOptions.find((opt) => {
                return opt.value === componentAttribute[0];
              })
            ) {
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
            // существует ли атрибут с таким названием у данного компонента
            const attributeOptions = attributeOptionsSearch(componentAttribute[0]);
            if (
              !attributeOptions.find((opt) => {
                return opt.value === componentAttribute[1];
              })
            ) {
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
    onSubmit(
      {
        component: selectedComponent,
        method: selectedMethod,
        args: parameters,
      },
      idx
    );
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
  }, [smId, controller, platforms, initialData]);

  return (
    <Modal
      title={`Выберите ${isEditingEvent ? 'событие' : 'действие'}`}
      onSubmit={handleSubmit}
      overlayClassName="z-[60]"
      isOpen={isOpen}
      onRequestClose={onClose}
    >
      <div className="mb-4 grid grid-cols-2 items-center gap-3">
        <Select
          className="w-full"
          options={componentOptions}
          value={componentOptions.find((o) => o.value === selectedComponent) ?? null}
          onChange={handleComponentChange}
          placeholder="Выберите компонент..."
          isMulti={false}
          isClearable={false}
          isSearchable={false}
          noOptionsMessage={() => <div>Отсутствуют подходящие компоненты</div>}
        />
        <Select
          className="w-full"
          options={methodOptions}
          value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
          onChange={handleMethodChange}
          placeholder="Выберите действие..."
          isMulti={false}
          isClearable={false}
          isSearchable={false}
          noOptionsMessage={() => (
            <div>
              У компонента отсутствуют действия <br /> Выберите другой компонент
            </div>
          )}
        />
      </div>

      <ActionsModalParameters
        protoParameters={protoParameters}
        parameters={parameters}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
        componentOptions={componentWithVariablesOptions}
        controller={controller}
        smId={smId}
        attributeOptionsSearch={attributeOptionsSearch}
      />
    </Modal>
  );
};
