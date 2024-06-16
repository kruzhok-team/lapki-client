import React, { useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { Modal, Select, SelectOption } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Action, ArgList } from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';

import { ActionsModalParameters } from './ActionsModalParameters';

export interface ActionsModalData {
  action: Action;
  isEditingEvent: boolean;
}

interface ActionsModalProps {
  initialData?: ActionsModalData;
  isOpen: boolean;
  onSubmit: (data: Action) => void;
  onClose: () => void;
}

export const ActionsModal: React.FC<ActionsModalProps> = ({
  initialData,
  onSubmit,
  isOpen,
  onClose,
}) => {
  const { controller, model } = useEditorContext();
  const componentsData = model.useData('elements.components');
  const visual = model.useData('elements.visual');

  const isEditingEvent = initialData?.isEditingEvent ?? false;

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [protoParameters, setProtoParameters] = useState<ArgumentProto[]>([]);
  const [parameters, setParameters] = useState<ArgList>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const componentOptions: SelectOption[] = useMemo(() => {
    if (!controller.platform) return [];

    const getComponentOption = (id: string) => {
      const proto = controller.platform!.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: visual && controller.platform!.getFullComponentIcon(id, 'mr-1size-7'),
      };
    };

    const result = Object.entries(componentsData)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([idx]) => getComponentOption(idx));

    if (isEditingEvent) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [controller.platform, componentsData, isEditingEvent, visual]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent || !controller.platform) return [];
    const getAll =
      controller.platform[isEditingEvent ? 'getAvailableEvents' : 'getAvailableMethods'];
    const getImg = controller.platform[isEditingEvent ? 'getEventIconUrl' : 'getActionIconUrl'];

    // Тут call потому что контекст теряется
    return getAll.call(controller.platform, selectedComponent).map(({ name, description }) => {
      return {
        value: name,
        label: name,
        hint: description,
        icon: visual && (
          <img
            src={getImg.call(controller.platform, selectedComponent, name, true)}
            className="mr-1 size-7 object-contain"
          />
        ),
      };
    });
  }, [selectedComponent, controller.platform, isEditingEvent, visual]);

  // Функция обновления параметров при смене метода в селекте
  const updateParameters = (componentName: string | null, method: string | null) => {
    if (!componentName || !method || !controller.platform) return;

    let parameters: ArgList = {};

    // Этот блок нужен для то чтобы по возвращению на начальное состояние сбросить параметры до начального состояния а не очищать совсем)
    if (initialData) {
      if (initialData.action.component === componentName && initialData.action.method === method) {
        parameters = initialData.action.args ?? {};
      }
    }

    const componentProto = controller.platform.getComponent(componentName);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Для работы модалки внутри модалки, чтобы не отправлять родительскую форму

    // Если есть ошибка то не отправляем форму
    for (const key in errors) {
      if (errors[key]) return;
    }
    if (!selectedComponent || !selectedMethod) return;

    onSubmit({
      component: selectedComponent,
      method: selectedMethod,
      args: parameters,
    });
  };

  // Обработка начальных данных
  useLayoutEffect(() => {
    // Сброс всего если нет начальных данных, то есть когда создаём новое событие
    if (!initialData) {
      setSelectedComponent(null);
      setSelectedMethod(null);
      setProtoParameters([]);
      setParameters({});
      setErrors({});

      return;
    }

    const init = (action: Action, path: 'signals' | 'methods') => {
      if (!controller.platform) return;

      const { component, method, args = {} } = action;
      const componentProto = controller.platform.getComponent(component);
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
  }, [controller, initialData]);

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
          isMulti={false}
          isClearable={false}
          isSearchable={false}
        />
        <Select
          className="w-full"
          options={methodOptions}
          value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
          onChange={handleMethodChange}
          isMulti={false}
          isClearable={false}
          isSearchable={false}
        />
      </div>

      <ActionsModalParameters
        protoParameters={protoParameters}
        parameters={parameters}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
      />
    </Modal>
  );
};
