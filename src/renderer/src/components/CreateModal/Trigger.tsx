import React from 'react';

import { SingleValue } from 'react-select';

import { Select, SelectOption } from '@renderer/components/UI';

interface TriggerProps {
  componentOptions: SelectOption[];
  methodOptions: SelectOption[];
  selectedComponent: string | null;
  selectedMethod: string | null;
  onComponentChange: (value: SingleValue<SelectOption>) => void;
  onMethodChange: (value: SingleValue<SelectOption>) => void;
}

export const Trigger: React.FC<TriggerProps> = (props) => {
  const {
    componentOptions,
    methodOptions,
    selectedComponent,
    selectedMethod,
    onComponentChange,
    onMethodChange,
  } = props;

  return (
    <div className="flex items-center gap-2">
      <p className="font-bold">Когда:</p>
      <div className="flex w-full gap-2">
        <Select
          containerClassName="w-full"
          options={componentOptions}
          onChange={onComponentChange}
          value={componentOptions.find((o) => o.value === selectedComponent) ?? null}
          isSearchable={false}
        />
        <Select
          containerClassName="w-full"
          options={methodOptions}
          onChange={onMethodChange}
          value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
          isSearchable={false}
        />
      </div>
    </div>
  );
};
