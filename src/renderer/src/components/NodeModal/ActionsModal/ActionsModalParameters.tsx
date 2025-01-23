import React, { useState } from 'react';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { AttributeConstSwitch } from '@renderer/components/AttributeConstSwitch';
import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Select, SelectOption, WithHint } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { isVariable } from '@renderer/lib/utils';
import { ArgList, Variable } from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';
import { createEmptyMatrix, formatArgType, getMatrixDimensions } from '@renderer/utils';
import { getComponentAttribute } from '@renderer/utils/ComponentAttribute';

import { MatrixWidget } from './MatrixWidget';

interface ActionsModalParametersProps {
  protoParameters: ArgumentProto[];
  parameters: ArgList;
  setParameters: (data: ArgList) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  componentOptions: SelectOption[];
  methodOptionsSearch: (selectedParameterComponent: string | null) => {
    value: string;
    label: string;
    hint: string | undefined;
    icon: JSX.Element;
  }[];

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
  const handleInputChange = (name: string, value: string | Variable) => {
    setErrors((p) => ({ ...p, [name]: '' }));
    parameters[name] = value;
    setParameters({ ...parameters });
  };

  const handleComponentAttributeChange = (name: string, component: string, attribute: string) => {
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
    handleInputChange(name, inputValue);
  };

  const [isChecked, setIsChecked] = useState<Map<string, boolean>>(new Map());

  const onChange = (parameter: string, row: number, col: number, value: number) => {
    (parameters[parameter] as number[][])[row][col] = value;
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
                onChange={(opt) => handleInputChange(name, opt?.value ?? '')}
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
                  key={name}
                  {...{
                    width: width,
                    height: height,
                    values: parameters[name] as number[][],
                    isClickable: true,
                    style: {
                      ledHeight: 16,
                      ledWidth: 16,
                      margin: 1,
                      border: 2,
                      isRounded: true,
                    },
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
          <div className="flex items-start space-x-1" key={name}>
            <AttributeConstSwitch
              defaultIsAttribute={currentChecked}
              beforeSwitch={(currentIsAttribute) => {
                setCheckedTo(name, !currentIsAttribute);
                handleInputChange(name, '');
              }}
            ></AttributeConstSwitch>
            {currentChecked ? (
              <div className="w-full">
                <div className="flex">
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
                  <div className="flex w-full">
                    <Select
                      containerClassName="w-full"
                      options={componentOptions}
                      onChange={(opt) => handleComponentAttributeChange(name, opt?.value ?? '', '')}
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
                          opt?.value ?? ''
                        )
                      }
                      value={methodOptions.find((o) => o.value === selectedParameterMethod) ?? null}
                      isSearchable={false}
                      noOptionsMessage={() => 'Нет подходящих атрибутов'}
                    />
                  </div>
                </div>
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
                onChange={(e) => handleInputChange(name, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
