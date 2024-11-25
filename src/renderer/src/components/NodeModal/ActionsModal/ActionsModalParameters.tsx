import React from 'react';

import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Select } from '@renderer/components/UI';
import { ArgList } from '@renderer/types/diagram';
import { ArgType, ArgumentProto } from '@renderer/types/platform';
import { createEmptyMatrix, formatArgType, getMatrixDimensions, validators } from '@renderer/utils';

import { MatrixWidget } from './MatrixWidget';

interface ActionsModalParametersProps {
  protoParameters: ArgumentProto[];
  parameters: ArgList;
  setParameters: (data: ArgList) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ActionsModalParameters: React.FC<ActionsModalParametersProps> = ({
  protoParameters,
  parameters,
  setParameters,
  errors,
  setErrors,
}) => {
  const handleInputChange = (name: string, type: ArgType | undefined, value: string) => {
    if (type && typeof type === 'string' && validators[type]) {
      if (!validators[type](value)) {
        setErrors((p) => ({ ...p, [name]: `Неправильный тип (${formatArgType(type)})` }));
      } else {
        setErrors((p) => ({ ...p, [name]: '' }));
      }
    }

    parameters[name] = value;
    setParameters({ ...parameters });
  };

  const onChange = (parameter: string, row: number, col: number, value: number) => {
    (parameters[parameter] as number[][])[row][col] = value;
    setParameters({
      ...parameters,
    });
  };

  if (protoParameters.length === 0) {
    return null;
    // return <div className="flex text-text-inactive">Параметров нет</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-1 text-xl">Параметры:</h3>
      {protoParameters.map((proto) => {
        const { name, description = '', type = '' } = proto;
        const value = parameters[name] ?? '';
        const error = errors[name];
        const hint =
          description + (type && `${description ? '\n' : ''}Тип: ${formatArgType(type)}`);
        const label = name + ':';

        if (Array.isArray(type)) {
          const options = type.map((value) => ({ label: value, value }));
          return (
            <ComponentFormFieldLabel key={name} label={label} hint={hint}>
              <Select
                className="w-[250px]"
                options={options}
                value={options.find((o) => o.value === value)}
                onChange={(opt) => handleInputChange(name, type, opt?.value ?? '')}
              />
            </ComponentFormFieldLabel>
          );
        }
        if (type.startsWith('Matrix')) {
          const { width, height } = getMatrixDimensions(type);
          if (!value) {
            const newMatrix = createEmptyMatrix(type);
            parameters[name] = newMatrix.values;
            setParameters({ ...parameters });
          }
          if (Array.isArray(value) && Array.isArray(value[0])) {
            return (
              <ComponentFormFieldLabel
                as="div"
                key={name}
                label={label}
                hint={hint}
                error={error}
                name={name}
              >
                <MatrixWidget
                  {...{
                    width: width,
                    height: height,
                    values: parameters[name] as number[][],
                  }}
                  onChange={onChange.bind(this, name)}
                />
              </ComponentFormFieldLabel>
            );
          }
        }

        return (
          <ComponentFormFieldLabel
            key={name}
            label={label}
            hint={hint}
            error={error}
            value={value as string}
            name={name}
            onChange={(e) => handleInputChange(name, type, e.target.value)}
          />
        );
      })}
    </div>
  );
};
