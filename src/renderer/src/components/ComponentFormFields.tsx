import React from 'react';

import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { ComponentFormFieldLabel } from './ComponentFormFieldLabel';

interface ComponentFormFieldsProps {
  showMainData: boolean;
  protoParameters: ComponentProto['parameters'];

  parameters: ComponentData['parameters'];
  setParameters: (data: ComponentData['parameters']) => void;
  name: string;
  setName: (data: string) => void;
}

export const ComponentFormFields: React.FC<ComponentFormFieldsProps> = ({
  showMainData,
  protoParameters,
  parameters,
  name,
  setParameters,
  setName,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parameters[e.target.name] = e.target.value;

    setParameters({ ...parameters });
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-1 text-xl">Параметры:</h3>

      {showMainData && (
        <>
          <ComponentFormFieldLabel label="Название:">
            <input
              className="w-[250px] rounded border bg-transparent px-2 py-1 outline-none"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </ComponentFormFieldLabel>

          <ComponentFormFieldLabel label="Метка:">
            <input
              className="w-[250px] rounded border bg-transparent px-2 py-1 outline-none"
              value={parameters['label'] ?? ''}
              name={'label'}
              maxLength={3}
              onChange={handleInputChange}
            />
          </ComponentFormFieldLabel>

          <ComponentFormFieldLabel label="Цвет метки:">
            <input
              className="rounded border bg-transparent outline-none"
              value={parameters['labelColor'] ?? '#FFFFFF'}
              name={'labelColor'}
              type="color"
              onChange={handleInputChange}
            />
          </ComponentFormFieldLabel>
        </>
      )}

      {Object.entries(protoParameters).map(([idx, param]) => {
        const name = param.name ?? idx;
        const value = parameters[name] ?? '';
        return (
          <ComponentFormFieldLabel key={idx} label={name + ':'}>
            <input
              className="w-[250px] rounded border bg-transparent px-2 py-1 outline-none"
              value={value}
              name={name}
              onChange={handleInputChange}
            />
          </ComponentFormFieldLabel>
        );
      })}
    </div>
  );
};
