import React, { useEffect } from 'react';

import { ComponentFormFieldLabel } from './ComponentFormFieldLabel';
import { StateMachineData } from '@renderer/lib/types';

interface StateMachineFormFields {
  parameters: StateMachineData;
  setParameters: (data: StateMachineData) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const StateMachineFormFields: React.FC<StateMachineFormFields> = ({
  parameters,
  setParameters,
  errors,
  setErrors,
}) => {
  const handleInputChange = (name: string, value: string) => {
    parameters[name] = value;
    setParameters({ ...parameters });
  };
  const protoParametersArray = Object.entries(parameters);

  // Первоначальное создание объекта ошибок
  useEffect(() => {
    setErrors(
      Object.fromEntries(
        Object.entries(parameters).map(([idx]) => {
          const name = idx;
          return [name, ''];
        })
      )
    );
  }, [parameters, setErrors]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-1 text-xl">Параметры:</h3>

      {protoParametersArray.map(([idx]) => {
        const name = idx;
        const value = parameters[name] ?? '';
        const error = errors[name];

        return (
          <ComponentFormFieldLabel
            key={idx}
            label={name + ':'}
            hint={'Название машины состояний.' + 'string'}
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
