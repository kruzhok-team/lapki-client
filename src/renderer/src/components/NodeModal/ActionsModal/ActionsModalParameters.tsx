import React, { useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { Checkbox, Select, SelectOption } from '@renderer/components/UI';
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

  const handleInputChange = (name: string, type: ArgType | undefined, value: string) => {
    // if (type && typeof type === 'string' && validators[type]) {
    //   if (!validators[type](value)) {
    //     setErrors((p) => ({ ...p, [name]: `Неправильный тип (${formatArgType(type)})` }));
    //   } else {
    //     setErrors((p) => ({ ...p, [name]: '' }));
    //   }
    // }

    parameters[name] = value;
    setParameters({ ...parameters });
  };

  const [selectedParameterComponent, setSelectedParameterComponent] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const filteredComponentOptions = componentOptions?.filter((v) => v.value != selectedComponent);
  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedParameterComponent || !controller.platform) return [];
    const getAll = controller.platform['getAvailableVariables'];
    const getImg = controller.platform['getVariableIconUrl'];

    // Тут call потому что контекст теряется
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
  }, [controller.platform, selectedParameterComponent]);

  const handleComponentChange = (
    name: string,
    type: ArgType | undefined,
    value: SingleValue<SelectOption>
  ) => {
    setSelectedParameterComponent(value?.value ?? null);
    setSelectedMethod(null);
    handleInputChange(name, type, '');
  };

  const handleMethodChange = (
    name: string,
    type: ArgType | undefined,
    value: SingleValue<SelectOption>
  ) => {
    setSelectedMethod(value?.value ?? null);
    if (value) {
      handleInputChange(name, type, `${selectedParameterComponent}.${value?.value}`);
    }
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

        return (
          <div className="flex items-start" key={name}>
            <Checkbox
              checked={!isChecked}
              onCheckedChange={(v) => setIsChecked(!v)}
              className="mr-2 mt-[9px]"
            />
            {isChecked ? (
              <div className="flex w-full gap-2" key={name}>
                <Select
                  containerClassName="w-full"
                  options={filteredComponentOptions}
                  onChange={(opt) => handleComponentChange(name, type, opt)}
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
                  onChange={(opt) => handleMethodChange(name, type, opt)}
                  value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
                  isSearchable={false}
                  //error={errors.selectedMethodParam1 || ''}
                />
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
