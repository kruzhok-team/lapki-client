import React, { useEffect } from 'react';

import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';
import { formatArgType, validators } from '@renderer/utils';

import { ComponentFormFieldLabel } from './ComponentFormFieldLabel';
import { ColorInput, Select } from './UI';

interface ComponentFormFieldsProps {
  showMainData: boolean;
  protoParameters: ComponentProto['parameters'];

  parameters: ComponentData['parameters'];
  setParameters: (data: ComponentData['parameters']) => void;
  name: string;
  setName: (data: string) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ComponentFormFields: React.FC<ComponentFormFieldsProps> = ({
  showMainData,
  protoParameters,
  parameters,
  name,
  setParameters,
  setName,
  errors,
  setErrors,
}) => {
  const handleInputChange = (name: string, value: string) => {
    const type = protoParameters[name]?.type;

    if (
      !['label', 'labelColor'].includes(name) &&
      type &&
      typeof type === 'string' &&
      validators[type]
    ) {
      if (!validators[type](value)) {
        setErrors((p) => ({ ...p, [name]: `Неправильный тип (${formatArgType(type)})` }));
      } else {
        setErrors((p) => ({ ...p, [name]: '' }));
      }
    }

    parameters[name] = value;
    setParameters({ ...parameters });
  };

  const protoParametersArray = Object.entries(protoParameters);

  // Первоначальное создание объекта ошибок
  useEffect(() => {
    setErrors(
      Object.fromEntries(
        Object.entries(protoParameters).map(([idx, param]) => {
          const name = param.name ?? idx;
          return [name, ''];
        })
      )
    );
  }, [protoParameters, setErrors]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-1 text-xl">Параметры:</h3>

      {showMainData && (
        <>
          <ComponentFormFieldLabel
            label="Название:"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <ComponentFormFieldLabel
            label="Метка:"
            hint="До 3-х символов. Метка нужна для различения разных компонентов одного типа."
            value={parameters['label'] ?? ''}
            name="label"
            maxLength={3}
            onChange={(e) => handleInputChange('label', e.target.value)}
          />

          <ComponentFormFieldLabel label="Цвет метки:" name="labelColor">
            <ColorInput
              value={parameters['labelColor'] ?? '#FFFFFF'}
              onChange={(value) => handleInputChange('labelColor', value)}
            />
          </ComponentFormFieldLabel>
        </>
      )}

      {!showMainData && !protoParametersArray.length && 'У данного компонента нет параметров'}

      {protoParametersArray.map(([idx, param]) => {
        const name = param.name ?? idx;
        const value = parameters[name] ?? '';
        const type = protoParameters[name].type;
        const error = errors[name];

        if (Array.isArray(type)) {
          const options = type.map((value) => ({ label: value, value }));
          return (
            <ComponentFormFieldLabel
              key={idx}
              label={name + ':'}
              hint={param.description + (type ? `\nТип: ${formatArgType(type)}` : '')}
            >
              <Select
                className="w-[250px]"
                options={options}
                value={options.find((o) => o.value === value)}
                onChange={({ value }: any) => handleInputChange(name, value)}
              />
            </ComponentFormFieldLabel>
          );
        }

        return (
          <ComponentFormFieldLabel
            key={idx}
            label={name + ':'}
            hint={param.description + (type ? `\nТип: ${formatArgType(type)}` : '')}
            error={error}
            value={value}
            name={name}
            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
          />
        );
      })}
    </div>
  );
};
