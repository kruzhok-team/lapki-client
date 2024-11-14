import React, { useState } from 'react';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Checkbox, Select, SelectOption, WithHint } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';
import { ArgList } from '@renderer/types/diagram';
import { ArgType, ArgumentProto } from '@renderer/types/platform';
import { formatArgType, validators } from '@renderer/utils';
interface ActionsModalParametersProps {
  protoParameters: ArgumentProto[];
  parameters: ArgList;
  setParameters: (data: ArgList) => void;

  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  selectedComponent: string | null;
  componentOptions: SelectOption[];
}

export const ActionsModalParameters: React.FC<ActionsModalParametersProps> = ({
  protoParameters,
  parameters,
  setParameters,
  errors,
  setErrors,
  selectedComponent,
  componentOptions,
}) => {
  const { controller } = useEditorContext();
  const Component = 'label';

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

  //const [selectedParameterComponent, setSelectedParameterComponent] = useState<string | null>(null);
  //const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState<boolean | null>(null);

  const filteredComponentOptions = componentOptions?.filter((v) => v.value != selectedComponent);
  const methodOptionsSearch = (selectedParameterComponent: string | null) => {
    if (!selectedParameterComponent || !controller.platform) return [];
    const getAll = controller.platform['getAvailableVariables'];
    const getImg = controller.platform['getVariableIconUrl'];

    return getAll
      .call(controller.platform, selectedParameterComponent)
      .map(({ name, description }) => {
        return {
          value: name,
          label: name,
          hint: description,
          icon: (
            <img
              src={getImg.call(controller.platform, selectedParameterComponent, name, true)}
              className="mr-1 h-7 w-7 object-contain"
            />
          ),
        };
      });
  };

  const isAttribute = (parameter: string) => {
    if (parameter.includes('"') || !isNaN(Number(parameter))) {
      return false;
    }
    const splitParameter = parameter.split('.');
    if (splitParameter.length != 2) {
      return false;
    }
    const component = splitParameter[0];
    const method = splitParameter[1];
    for (const opt of componentOptions) {
      if (opt.value == component) {
        return true;
      }
    }
    for (const opt of methodOptionsSearch(splitParameter[0])) {
      if (opt.value == method) {
        return true;
      }
    }
    return false;
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

        // в первый раз проверяет является ли записанное значение атрибутом, затем отслеживает нажатие на чекбокс
        const currentChecked = isChecked ?? isAttribute(value);
        const valueSplit = value.split('.');
        const selectedParameterComponent = currentChecked ? valueSplit[0] : null;
        const selectedParameterMethod = currentChecked ? valueSplit[1] : null;
        const methodOptions = methodOptionsSearch(selectedParameterComponent);
        return (
          <div className="flex items-start" key={name}>
            <Checkbox
              checked={currentChecked}
              onCheckedChange={() => {
                setIsChecked(!currentChecked);
                handleInputChange(name, type, '');
              }}
              className="mr-2 mt-[9px]"
            />
            {currentChecked ? (
              <div className="flex w-full gap-2" key={name}>
                <Component className="grid grid-cols-[max-content,1fr] items-center justify-start gap-2">
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
                </Component>
                <Select
                  containerClassName="w-full"
                  options={filteredComponentOptions}
                  onChange={(opt) => handleInputChange(name, undefined, opt?.value ?? '')}
                  value={
                    filteredComponentOptions.find((o) => o.value === selectedParameterComponent) ??
                    null
                  }
                  isSearchable={false}
                  //error={errors.selectedComponentParam1 || ''}
                />
                <Select
                  containerClassName="w-full"
                  options={methodOptions}
                  onChange={(opt) =>
                    handleInputChange(
                      name,
                      undefined,
                      `${selectedParameterComponent}.${opt?.value ?? ''}`
                    )
                  }
                  value={methodOptions.find((o) => o.value === selectedParameterMethod) ?? null}
                  isSearchable={false}
                  //error={errors.selectedMethodParam1 || ''}
                />
                <p className="pl-[120px] text-sm text-error">{error}</p>
              </div>
            ) : (
              <ComponentFormFieldLabel
                key={name}
                label={label}
                hint={hint}
                error={error}
                value={value}
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
