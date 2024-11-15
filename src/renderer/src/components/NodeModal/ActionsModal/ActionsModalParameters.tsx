import React from 'react';

import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Select } from '@renderer/components/UI';
import { ArgList } from '@renderer/types/diagram';
import { Matrix } from '@renderer/types/MatrixWidget';
import { ArgType, ArgumentProto } from '@renderer/types/platform';
import { formatArgType, validators } from '@renderer/utils';

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

  const onChange = (
    parameter: string,
    width: number,
    height: number,
    raw: number,
    col: number,
    value: number
  ) => {
    const matrix = parseMatrixFromString(parameters[parameter], width, height);
    matrix[raw][col] = value;
    parameters[parameter] = buildMatrix({
      values: matrix,
      height,
      width,
    });
    setParameters({
      ...parameters,
    });
  };

  const buildMatrix = (matrix: Matrix) => {
    let strMatrix = '{';
    for (let raw = 0; raw != matrix.height; raw += 1) {
      for (let col = 0; col != matrix.width; col += 1) {
        strMatrix += Number(matrix.values[raw][col]).toString() + ', ';
      }
    }
    strMatrix = strMatrix.slice(0, strMatrix.length - 2) + '}';

    return strMatrix;
  };

  const parseMatrixFromString = (values: string, width: number, height: number): number[][] => {
    const matrixValues: number[][] = [];
    const parsedValues = values
      .slice(1, values.length - 1)
      .split(',')
      .map((str) => str.trim());
    for (let raw = 0; raw != height; raw += 1) {
      matrixValues.push(
        parsedValues.slice(raw * width, (raw + 1) * width).map((value) => Number(value))
      );
    }
    return matrixValues;
  };
  const initMatrix = (parameter: string, type: string, value: string): Matrix => {
    const rawSize = type.split('Matrix')[1];
    const [width, height] = rawSize.split('x').map((value) => Number(value));
    if (!parameters[parameter]) {
      const emptyValues: number[][] = [];
      for (let raw = 0; raw != height; raw++) {
        emptyValues.push([]);
        for (let col = 0; col != width; col++) {
          emptyValues[raw].push(0);
        }
      }
      parameters[parameter] = buildMatrix({
        values: emptyValues,
        width: width,
        height: height,
      });
      return {
        width,
        height,
        values: emptyValues, // TODO: Если есть значение парсить его и вставлять
      };
    }
    return {
      width,
      height,
      values: parseMatrixFromString(parameters[parameter], width, height), // TODO: Если есть значение парсить его и вставлять
    };
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
          const matrix = initMatrix(name, type, value);
          return (
            <ComponentFormFieldLabel
              key={name}
              label={label}
              hint={hint}
              error={error}
              value={value}
              name={name}
            >
              <MatrixWidget
                {...matrix}
                onChange={onChange.bind(this, name, matrix.width, matrix.height)}
              />
            </ComponentFormFieldLabel>
          );
        }

        return (
          <ComponentFormFieldLabel
            key={name}
            label={label}
            hint={hint}
            error={error}
            value={value}
            name={name}
            onChange={(e) => handleInputChange(name, type, e.target.value)}
          />
        );
      })}
    </div>
  );
};
