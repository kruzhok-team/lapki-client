import React, { useEffect } from 'react';

import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';
import { formatArgType, validators } from '@renderer/utils';

import { idError } from './ComponentEditModal';
import { ComponentFormFieldLabel } from './ComponentFormFieldLabel';
import { ColorInput, ParameterSelect, TextInput } from './UI';

interface ComponentFormFieldsProps {
  showMainData: boolean;
  protoParameters: ComponentProto['constructorParameters'];
  protoInitializationParameters: ComponentProto['initializationParameters'];
  parameters: ComponentData['parameters'];
  setParameters: (data: ComponentData['parameters']) => void;
  name: string | undefined;
  id: string;
  setName: (data: string) => void;
  setComponentId: (data: string) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ComponentFormFields: React.FC<ComponentFormFieldsProps> = ({
  showMainData,
  protoParameters,
  protoInitializationParameters,
  parameters,
  name,
  setParameters,
  setName,
  id,
  setComponentId,
  errors,
  setErrors,
}) => {
  const allParameters = { ...protoParameters, ...protoInitializationParameters };
  const handleInputChange = (name: string, value: string) => {
    const type = allParameters[name]?.type;

    if (!['label', 'labelColor'].includes(name) && type) {
      if (typeof type === 'string' && validators[type] && !validators[type](value)) {
        setErrors((p) => ({ ...p, [name]: `Неправильный тип (${formatArgType(type)})` }));
      } else {
        setErrors((p) => ({ ...p, [name]: '' }));
      }
    }

    parameters[name] = value;
    setParameters({ ...parameters });
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // очищаем предыдущий статус ошибки
    setErrors((p) => ({ ...p, [idError]: '' }));
    // динамическая замена пробелов
    let id = event.target.value;
    const caret = event.target.selectionStart;
    const element = event.target;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret;
      element.selectionEnd = caret;
    });
    id = id.replaceAll(' ', '_');
    setComponentId(id);
  };
  const protoParametersArray = Object.entries(allParameters);

  // Первоначальное создание объекта ошибок
  useEffect(() => {
    setErrors(
      Object.fromEntries(
        Object.entries(allParameters).map(([idx]) => {
          return [idx, ''];
        })
      )
    );
  }, [protoParameters, protoInitializationParameters, setErrors]);

  return (
    <div className="grid grid-cols-[max-content,minmax(0,1fr)] gap-x-3 gap-y-3">
      {showMainData && (
        <>
          <ComponentFormFieldLabel
            label="Название"
            labelClassName="gap-2 font-medium"
            sharedGrid
            placeholder="Введите название..."
            maxLength={20}
            hint="Человекочитаемое название, которое будет отображаться в интерфейсе вместо технического. До 20 символов."
            value={name}
            onChange={(e) => handleNameChange(e)}
            autoFocus
          />

          <ComponentFormFieldLabel
            placeholder="Введите идентификатор..."
            label="Тех. название"
            labelClassName="gap-2 font-medium"
            sharedGrid
            maxLength={20}
            hint="Уникальное техническое название, которое будет использоваться в коде. До 20 символов, среди которых – латинские буквы, цифры и знаки подчёркивания. Не должно начинаться с цифры."
            value={id}
            onChange={(e) => handleIdChange(e)}
            error={errors[idError]}
            autoFocus
          />

          <ComponentFormFieldLabel
            label="Подпись"
            labelClassName="gap-2 font-medium"
            sharedGrid
            hint="До 3-х символов. Подпись нужна для различения иконок разных компонентов одного типа на схеме."
            as="div"
          >
            <div className="flex items-center gap-2.5">
              <TextInput
                className="h-8 max-w-none flex-1 rounded-lg px-2 py-1"
                value={parameters['label'] ?? ''}
                name="label"
                maxLength={3}
                onChange={(e) => handleInputChange('label', e.target.value)}
              />
              <ColorInput
                className="h-8 w-8 rounded-lg"
                clearable={false}
                value={parameters['labelColor'] ?? '#7CC3E8'}
                onChange={(value) => handleInputChange('labelColor', value)}
              />
            </div>
          </ComponentFormFieldLabel>
        </>
      )}

      {!showMainData && !protoParametersArray.length && (
        <div className="col-span-2">У данного компонента нет параметров</div>
      )}

      {protoParametersArray.map(([idx, param]) => {
        const name = param.name ?? idx;
        const value: string | undefined = parameters[idx];
        const type = allParameters[idx].type;
        const error = errors[idx];

        if (Array.isArray(type)) {
          const valueAliases = param.valueAlias;
          const options =
            valueAliases !== undefined &&
            Array.isArray(valueAliases) &&
            valueAliases.length === type.length
              ? type.map((value, index) => ({ label: valueAliases[index] ?? value, value }))
              : type.map((value) => ({ label: value, value }));
          return (
            <ComponentFormFieldLabel
              key={idx}
              error={error}
              label={name}
              labelClassName="gap-2 whitespace-pre font-medium"
              sharedGrid
              hint={param.description}
            >
              <ParameterSelect
                options={options}
                value={options.find((o) => o.value === value || o.value === Number(value))}
                onChange={(option) => handleInputChange(idx, String(option?.value ?? ''))}
              />
            </ComponentFormFieldLabel>
          );
        }

        return (
          <ComponentFormFieldLabel
            key={idx}
            label={name}
            labelClassName="gap-2 whitespace-pre font-medium"
            sharedGrid
            hint={param.description + (type ? `\nТип: ${formatArgType(type)}` : '')}
            error={error}
            value={value}
            name={idx}
            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
          />
        );
      })}
    </div>
  );
};
