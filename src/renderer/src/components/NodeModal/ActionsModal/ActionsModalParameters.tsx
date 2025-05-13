import React, { useState } from 'react';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { AttributeConstSwitch } from '@renderer/components/AttributeConstSwitch';
import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Select, SelectOption, WithHint } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { isVariable } from '@renderer/lib/utils';
import { ArgList, Variable } from '@renderer/types/diagram';
import { ArgType, ArgumentProto } from '@renderer/types/platform';
import {
  createEmptyMatrix,
  formatArgType,
  getDefaultRange,
  getMatrixDimensions,
  isMatrix,
  parseRange,
} from '@renderer/utils';
import { getComponentAttribute } from '@renderer/utils/ComponentAttribute';

import { MatrixWidget } from './MatrixWidget';

interface ActionsModalParametersProps {
  protoParameters: ArgumentProto[];
  parameters: ArgList;
  setParameters: (data: ArgList) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  componentOptions: SelectOption[];
  methodOptionsSearch: (selectedParameterComponent: string | null) => SelectOption[];

  smId: string;
  controller: CanvasController;
}

export const ActionsModalParameters: React.FC<ActionsModalParametersProps> = ({
  protoParameters,
  parameters,
  setParameters,
  errors,
  setErrors,
  componentOptions,
  methodOptionsSearch,
  smId,
  controller,
}) => {
  const handleInputChange = (name: string, order: number, value: string | Variable) => {
    setErrors((p) => ({ ...p, [name]: '' }));
    if (parameters[name]) {
      parameters[name].value = value;
    } else {
      parameters[name] = { value, order };
    }
    setParameters({ ...parameters });
  };

  const handleComponentAttributeChange = (
    name: string,
    order: number,
    component: string,
    attribute: string
  ) => {
    let inputValue: string | Variable = '';
    if (component || attribute) {
      inputValue = {
        component: component,
        method: attribute,
      };
      // const proto = controller.platform[smId].getComponent(component);
      // const delimiter =
      //   proto?.singletone || platform.staticComponents ? platform.staticActionDelimeter : '.';
      // inputValue = `${component}${delimiter}${attribute}`;
    }
    handleInputChange(name, order, inputValue);
  };

  const [isChecked, setIsChecked] = useState<Map<string, boolean>>(new Map());

  const onChange = (parameter: string, row: number, col: number, value: number) => {
    (parameters[parameter].value as number[][])[row][col] = value;
    setParameters({
      ...parameters,
    });
  };

  const setCheckedTo = (name: string, checked: boolean) => {
    setIsChecked((oldValue) => {
      const newValue = new Map(oldValue);
      newValue.set(name, checked);
      return newValue;
    });
  };

  const getHint = (description: string, type: ArgType) => {
    if (!type || Array.isArray(type) || isMatrix(type)) return description;
    return description + (description ? '\n' : '' + `Тип: {${formatArgType(type)}}`);
  };

  if (protoParameters.length === 0) {
    return null;
    // return <div className="flex text-text-inactive">Параметров нет</div>;
  }

  return (
    <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
      <h3 className="mb-1 text-xl">Параметры</h3>
      {protoParameters.map((proto, idx) => {
        const { name, description = '', type = '', range, step } = proto;
        const parameter = parameters[name] ?? { value: '', order: idx };
        const value = parameter.value;
        const error = errors[name];
        const hint = getHint(description, type);
        const label = name;
        if (Array.isArray(type)) {
          const valueAliases = proto.valueAlias;
          const options =
            valueAliases !== undefined &&
            Array.isArray(valueAliases) &&
            valueAliases.length === type.length
              ? type.map((value, index) => ({
                  label: valueAliases[index] ?? value,
                  value,
                }))
              : type.map((value) => ({ label: value, value }));
          return (
            <ComponentFormFieldLabel
              key={name}
              label={label}
              labelClassName="whitespace-pre"
              hint={hint}
              error={error}
              childrenDivClassname="ml-[50px] w-[300px]"
            >
              <Select
                options={options}
                value={options.find((o) => o.value === value)}
                onChange={(opt) => handleInputChange(name, idx, opt?.value ?? '')}
              />
            </ComponentFormFieldLabel>
          );
        }
        if (isMatrix(type)) {
          const { width, height } = getMatrixDimensions(type);
          const parsedRange = range ? parseRange(range, step) : getDefaultRange();
          if (!value) {
            const newMatrix = createEmptyMatrix(type);
            parameters[name] = {
              value: newMatrix.values,
              order: idx,
            };
          }

          if (Array.isArray(value) && Array.isArray(value[0])) {
            return (
              <ComponentFormFieldLabel
                as="div"
                key={name}
                label={label}
                labelClassName="whitespace-pre"
                hint={hint}
                error={error}
                name={name}
              >
                <MatrixWidget
                  key={name}
                  {...{
                    width: width,
                    height: height,
                    values: parameters[name].value as number[][],
                    isClickable: true,
                    style: {
                      ledHeight: 16,
                      ledWidth: 16,
                      margin: 1,
                      border: 2,
                      isRounded: true,
                    },
                    step: step ?? 1,
                    range: parsedRange,
                    isHalf: type.startsWith('Half'),
                  }}
                  onChange={onChange.bind(this, name)}
                />
              </ComponentFormFieldLabel>
            );
          }
        }
        const platform = controller.platform[smId];
        let currentChecked = isChecked.get(name);
        let selectedParameterMethod: string | null = null;
        let selectedParameterComponent: string | null = null;
        if (typeof value === 'string') {
          const componentAttribute = getComponentAttribute(value, platform);
          if (isChecked.get(name) === undefined) {
            setCheckedTo(name, componentAttribute != null);
          }
          selectedParameterComponent =
            currentChecked && componentAttribute ? componentAttribute[0] : null;
          selectedParameterMethod =
            currentChecked && componentAttribute ? componentAttribute[1] : null;
        } else if (isVariable(value)) {
          selectedParameterComponent = value.component;
          selectedParameterMethod = value.method;
          isChecked.set(name, true);
          currentChecked = true;
        }
        const methodOptions = methodOptionsSearch(selectedParameterComponent);
        return (
          <div className="flex space-x-2" key={name}>
            <div className="mt-[4px]">
              <AttributeConstSwitch
                checked={currentChecked}
                onCheckedChange={() => {
                  setCheckedTo(name, !currentChecked);
                  handleInputChange(name, idx, '');
                }}
                hint={
                  currentChecked
                    ? 'Переключиться на константу'
                    : 'Переключиться на атрибут компонента'
                }
              />
            </div>
            {currentChecked ? (
              <div>
                <div className="flex">
                  <label className="grid grid-cols-[max-content,1fr] items-center justify-start gap-2">
                    <div className="flex min-w-28 items-center gap-1">
                      <span className="whitespace-pre">{label}</span>
                      {hint && (
                        <WithHint hint={hint}>
                          {(props) => (
                            <div className="shrink-0" {...props}>
                              <QuestionMark className="h-5 w-5" />
                            </div>
                          )}
                        </WithHint>
                      )}
                    </div>
                  </label>
                  <div className="flex w-full">
                    <Select
                      containerClassName="w-[250px]"
                      options={componentOptions}
                      onChange={(opt) =>
                        handleComponentAttributeChange(name, idx, opt?.value ?? '', '')
                      }
                      value={
                        componentOptions.find((o) => o.value === selectedParameterComponent) ?? null
                      }
                      isSearchable={false}
                      noOptionsMessage={() => 'Нет подходящих компонентов'}
                      placeholder="Выберите компонент..."
                    />
                    <Select
                      containerClassName="w-[250px]"
                      options={methodOptions}
                      onChange={(opt) =>
                        handleComponentAttributeChange(
                          name,
                          idx,
                          selectedParameterComponent ?? '',
                          opt?.value ?? ''
                        )
                      }
                      value={methodOptions.find((o) => o.value === selectedParameterMethod) ?? null}
                      isSearchable={false}
                      noOptionsMessage={() => 'Нет подходящих атрибутов'}
                      placeholder="Выберите атрибут..."
                    />
                  </div>
                </div>
                <p className="pl-[120px] text-sm text-error">{error}</p>
              </div>
            ) : (
              <ComponentFormFieldLabel
                key={name}
                label={label}
                labelClassName="whitespace-pre"
                hint={hint}
                error={error}
                value={value as string}
                name={name}
                placeholder="Введите значение..."
                onChange={(e) => handleInputChange(name, idx, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
