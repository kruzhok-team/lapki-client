import React, { memo } from 'react';

import { Select } from '@renderer/components/UI';

import { useTrigger } from '../hooks';

type TriggerProps = ReturnType<typeof useTrigger>;

export const Trigger: React.FC<TriggerProps> = memo((props) => {
  const {
    componentOptions,
    methodOptions,

    selectedComponent,
    selectedMethod,
    onComponentChange,
    onMethodChange,
  } = props;

  return (
    <div>
      <div className="mb-2 flex items-end gap-2">
        <p className="text-lg font-bold">Когда</p>
      </div>

      <div className="pl-4">
        <div className="w-full">
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
      </div>
    </div>
  );
});
