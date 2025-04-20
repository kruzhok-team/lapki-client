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
  onSubmit: (data: Action) => void;
  onClose: () => void;
}

export const ActionsModal: React.FC<ActionsModalProps> = ({
  initialData,
  onSubmit,
  controller,
  smId,
  isOpen,
  onClose,
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

  // TODO(L140-beep): вынести логику в useActions
  const getComponentOption = (id: string, excludeIfEmpty: 'methods' | 'signals' | 'variables') => {
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
      icon: controller.platform[smId]?.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
    };
  };

  const getComponentOptions = (excludeIfEmpty: 'methods' | 'signals' | 'variables') => {
    if (!platforms[smId]) return [];

    const sortedComponents = Object.entries(componentsData).sort((a, b) => a[1].order - b[1].order);
    const result: Exclude<ReturnType<typeof getComponentOption>, undefined>[] = [];
    for (const [componentId] of sortedComponents) {
      const option = getComponentOption(componentId, excludeIfEmpty);
      if (option) {
        result.push(option);
      }
    }

    if (isEditingEvent) {
      const system = getComponentOption('System', excludeIfEmpty);
      if (system) {
        result.unshift(system);
      }
    }

    return result;
  };

  const componentOptions: SelectOption[] = useMemo(() => {
    return getComponentOptions('methods');
  }, [smId, platforms, componentsData, isEditingEvent, visual]);

  const componentWithVariablesOptions: SelectOption[] = useMemo(() => {
    return getComponentOptions('variables');
  }, [smId, platforms, componentsData, isEditingEvent, visual]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent || !platforms[smId]) return [];
    const getAll = platforms[smId][isEditingEvent ? 'getAvailableEvents' : 'getAvailableMethods'];
    const getImg = platforms[smId][isEditingEvent ? 'getEventIconUrl' : 'getActionIconUrl'];

    // Тут call потому что контекст теряется
    return getAll.call(platforms[smId], selectedComponent).map(({ name, description, alias }) => {
      return {
        value: name,
        label: alias ?? name,
        hint: description,
        icon: (
          <img
            src={getImg.call(platforms[smId], selectedComponent, name, true)}
            className="mr-1 size-7 object-contain"
          />
        ),
      };
    });
  }, [selectedComponent, platforms, isEditingEvent, visual]);

  const methodOptionsSearch = (selectedParameterComponent: string | null) => {
    if (!selectedParameterComponent || !controller?.platform[smId]) return [];
    const platformManager = controller.platform[smId];

    return platformManager
      .getAvailableVariables(selectedParameterComponent)
      .map(({ name, description, alias }) => {
        return {
          value: name,
          label: alias ?? name,
          hint: description,
          icon: (
            <img
              src={platformManager.getVariableIconUrl(selectedParameterComponent, name, true)}
              className="mr-1 h-7 w-7 object-contain"
            />
          ),
        };
      });
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
      !protoParameters.every((proto, idx) => {
        const { name, type = '' } = proto;
        const parameter = parameters[name] ?? { value: '', order: idx };
        const value = parameter.value;
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
          const attributeOptions = methodOptionsSearch(componentAttribute[0]);
          if (
            !attributeOptions.find((opt) => {
              return opt.value === componentAttribute[1];
            })
          ) {
            setErrors((p) => ({
              ...p,
              [name]: `Ошибка! Не удалось найти метод с таким названием.`,
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
    ) {
      return;
    }
    if (!selectedComponent || !selectedMethod) return;
    // TODO (L140-beep): не отправлять форму при отсутствии обязательных параметров
    onSubmit({
      component: selectedComponent,
      method: selectedMethod,
      args: parameters,
    });
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

    init(action, isEditingAction ? 'signals' : 'methods');
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
        methodOptionsSearch={methodOptionsSearch}
      />
    </Modal>
  );
};
