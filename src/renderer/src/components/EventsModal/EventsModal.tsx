import React, { useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { Modal, Select, SelectOption } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Event, ArgList } from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';

import { EventsModalParameters } from './EventsModalParameters';

export interface EventsModalData {
  event: Event;
  isEditingEvent: boolean;
}

interface EventsModalProps {
  initialData?: EventsModalData;
  isOpen: boolean;
  onSubmit: (data: Event) => void;
  onClose: () => void;
}

export const EventsModal: React.FC<EventsModalProps> = ({
  initialData,
  onSubmit,
  isOpen,
  onClose,
}) => {
  const editor = useEditorContext();
  const manager = editor.manager;

  const componentsData = manager.useData('elements.components');
  const machine = editor.container.machineController;
  const isEditingEvent = initialData?.isEditingEvent ?? false;

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [protoParameters, setProtoParameters] = useState<ArgumentProto[]>([]);
  const [parameters, setParameters] = useState<ArgList>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const componentOptions: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = machine.platform.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: machine.platform.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    if (isEditingEvent) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingEvent, machine]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent) return [];
    const getAll = machine.platform[isEditingEvent ? 'getAvailableEvents' : 'getAvailableMethods'];
    const getImg = machine.platform[isEditingEvent ? 'getEventIconUrl' : 'getActionIconUrl'];

    // Тут call потому что контекст теряется
    return getAll.call(machine.platform, selectedComponent).map(({ name, description }) => {
      return {
        value: name,
        label: name,
        hint: description,
        icon: (
          <img
            src={getImg.call(machine.platform, selectedComponent, name, true)}
            className="mr-1 h-7 w-7 object-contain"
          />
        ),
      };
    });
  }, [isEditingEvent, machine, selectedComponent]);

  // Функция обновления параметров при смене метода в селекте
  const updateParameters = (componentName: string | null, method: string | null) => {
    if (!componentName || !method) return;

    let parameters: ArgList = {};

    // Этот блок нужен для то чтобы по возвращению на начальное состояние сбросить параметры до начального состояния а не очищать совсем)
    if (initialData) {
      if (initialData.event.component === componentName && initialData.event.method === method) {
        parameters = initialData.event.args ?? {};
      }
    }

    const componentProto = machine.platform.getComponent(componentName);
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

    const init = (event: Event, path: 'signals' | 'methods') => {
      const { component, method, args = {} } = event;
      const componentProto = machine.platform.getComponent(component);
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

    const { event, isEditingEvent } = initialData;

    init(event, isEditingEvent ? 'signals' : 'methods');
  }, [machine, initialData]);

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

      <EventsModalParameters
        protoParameters={protoParameters}
        parameters={parameters}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
      />
    </Modal>
  );
};
