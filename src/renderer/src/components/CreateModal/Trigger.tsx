import React, { useState } from 'react';

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { SingleValue } from 'react-select';

import { Select, SelectOption, TabPanel, Tabs } from '@renderer/components/UI';

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

  const [tabValue, setTabValue] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <p className="font-bold">Когда:</p>

      <div className="w-full">
        <Tabs className="mb-4" tabs={['Выбор', 'Код']} value={tabValue} onChange={setTabValue} />

        <TabPanel value={0} tabValue={tabValue}>
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
        </TabPanel>

        <TabPanel value={1} tabValue={tabValue} className="w-full">
          <CodeMirror
            className="fixed overflow-hidden"
            value={''}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
            }}
            minHeight="100px"
          />
        </TabPanel>
      </div>
    </div>
  );
};
