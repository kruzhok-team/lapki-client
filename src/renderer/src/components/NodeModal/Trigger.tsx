import React, { useRef, useState } from 'react';

import CodeMirror, { Transaction, EditorState, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { SingleValue } from 'react-select';

import { Select, SelectOption, TabPanel, Tabs } from '@renderer/components/UI';

import './style.css';

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

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);

  const handleTabChange = (tab: number) => {
    setTabValue(tab);

    if (tab === 1) {
      setTimeout(() => {
        const view = editorRef?.current?.view;
        if (!view) return;

        view.focus();
        view.dispatch({
          selection: {
            anchor: view.state.doc.length,
            head: view.state.doc.length,
          },
        });
      }, 0);
    }
  };

  const handleLengthLimit = (tr: Transaction) => {
    return tr.newDoc.lines <= 10;
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="mb-1 min-w-11 font-bold">Когда</p>

        <Tabs
          className="mb-4"
          tabs={['Выбор', 'Код']}
          value={tabValue}
          onChange={handleTabChange}
        />
      </div>

      <div className="pl-2">
        <div className="w-full">
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

          <TabPanel value={1} tabValue={tabValue}>
            <CodeMirror
              ref={editorRef}
              value={''}
              placeholder={'Напишите код'}
              className="editor"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
              }}
              minHeight="4.7rem"
              width="100%"
              extensions={[EditorState.changeFilter.of(handleLengthLimit)]}
            />
          </TabPanel>
        </div>
      </div>
    </div>
  );
};
