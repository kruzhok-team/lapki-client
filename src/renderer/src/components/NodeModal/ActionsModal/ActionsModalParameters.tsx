import React, { useState } from 'react';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Checkbox, Select, SelectOption, WithHint } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { ArgList } from '@renderer/types/diagram';
import { ArgType, ArgumentProto, Platform } from '@renderer/types/platform';
import { createEmptyMatrix, formatArgType, getMatrixDimensions, validators } from '@renderer/utils';
import { getComponentAttribute } from '@renderer/utils/ComponentAttribute';

import { MatrixWidget } from './MatrixWidget';

interface ActionsModalParametersProps {
  protoParameters: ArgumentProto[];
  parameters: ArgList;
  setParameters: (data: ArgList) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  componentOptions: SelectOption[];

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
  smId,
  controller,
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

  const handleComponentAttributeChange = (
    name: string,
    component: string,
    attribute: string,
    platform: Platform | undefined
  ) => {
    if (!platform) return;
    let inputValue = '';
    if (component || attribute) {
      const proto = controller.platform[smId].getComponent(component);
      const delimiter =
        proto?.singletone || platform.staticComponents ? platform.staticActionDelimeter : '.';
      inputValue = `${component}${delimiter}${attribute}`;
    }
    handleInputChange(name, undefined, inputValue);
  };

  const [isChecked, setIsChecked] = useState<Map<string, boolean>>(new Map());

  const methodOptionsSearch = (selectedParameterComponent: string | null) => {
    if (!selectedParameterComponent || !controller?.platform[smId]) return [];
    const platformManager = controller.platform[smId];

    return platformManager
      .getAvailableVariables(selectedParameterComponent)
      .map(({ name, description }) => {
        return {
          value: name,
          label: name,
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
        const platform = controller.platform[smId].data;
        const componentAttibute = getComponentAttribute(value as string, platform);
        // в первый раз проверяет является ли записанное значение атрибутом, затем отслеживает нажатие на чекбокс
        const currentChecked = isChecked.get(name) ?? componentAttibute != null;
        const selectedParameterComponent =
          currentChecked && componentAttibute ? componentAttibute[0] : null;
        const selectedParameterMethod =
          currentChecked && componentAttibute ? componentAttibute[1] : null;
        const methodOptions = methodOptionsSearch(selectedParameterComponent);
        return (
          <div className="flex items-start" key={name}>
            <Checkbox
              checked={currentChecked}
              onCheckedChange={() => {
                setIsChecked((oldValue) => {
                  const newValue = new Map(oldValue);
                  newValue.set(name, !currentChecked);
                  return newValue;
                });
                handleInputChange(name, type, '');
              }}
              className="mr-2 mt-[9px]"
            />
            {currentChecked ? (
              <div className="flex w-full gap-2" key={name}>
                <label className="grid grid-cols-[max-content,1fr] items-center justify-start gap-2">
                  <div className="flex min-w-28 items-center gap-1">
                    <span>{label}</span>
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
                <Select
                  containerClassName="w-full"
                  options={componentOptions}
                  onChange={(opt) =>
                    handleComponentAttributeChange(name, opt?.value ?? '', '', platform)
                  }
                  value={
                    componentOptions.find((o) => o.value === selectedParameterComponent) ?? null
                  }
                  isSearchable={false}
                  noOptionsMessage={() => 'Нет подходящих компонентов'}
                />
                <Select
                  containerClassName="w-full"
                  options={methodOptions}
                  onChange={(opt) =>
                    handleComponentAttributeChange(
                      name,
                      selectedParameterComponent ?? '',
                      opt?.value ?? '',
                      platform
                    )
                  }
                  value={methodOptions.find((o) => o.value === selectedParameterMethod) ?? null}
                  isSearchable={false}
                  noOptionsMessage={() => 'Нет подходящих атрибутов'}
                />
                <p className="pl-[120px] text-sm text-error">{error}</p>
              </div>
            ) : (
              <ComponentFormFieldLabel
                key={name}
                label={label}
                hint={hint}
                error={error}
                value={value as string}
                name={name}
                onChange={(e) => handleInputChange(name, type, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
