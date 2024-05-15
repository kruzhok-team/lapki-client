import React, { useRef, useState } from 'react';

import CodeMirror, { ReactCodeMirrorRef, Transaction, EditorState } from '@uiw/react-codemirror';
import { SingleValue } from 'react-select';
import { twMerge } from 'tailwind-merge';

import { Checkbox, Select, SelectOption, TabPanel, Tabs, TextField } from '@renderer/components/UI';

const operand = [
  {
    value: 'greater',
    label: '>',
  },
  {
    value: 'less',
    label: '<',
  },
  {
    value: 'equals',
    label: '=',
  },
  {
    value: 'notEquals',
    label: '!=',
  },
  {
    value: 'greaterOrEqual',
    label: '>=',
  },
  {
    value: 'lessOrEqual',
    label: '<=',
  },
];

interface ConditionProps {
  show: boolean;
  handleChangeConditionShow: (value: boolean) => void;
  isParamOneInput1: boolean;
  handleParamOneInput1: (value: boolean) => void;
  isParamOneInput2: boolean;
  handleParamOneInput2: (value: boolean) => void;

  componentOptionsParam1: SelectOption[];
  handleComponentParam1Change: (value: SingleValue<SelectOption>) => void;
  selectedComponentParam1: string | null;
  methodOptionsParam1: SelectOption[];
  handleMethodParam1Change: (value: SingleValue<SelectOption>) => void;
  selectedMethodParam1: string | null;

  setConditionOperator: (value: string | null) => void;
  conditionOperator: string | null;

  componentOptionsParam2: SelectOption[];
  handleComponentParam2Change: (value: SingleValue<SelectOption>) => void;
  selectedComponentParam2: string | null;
  methodOptionsParam2: SelectOption[];
  handleMethodParam2Change: (value: SingleValue<SelectOption>) => void;
  selectedMethodParam2: string | null;

  argsParam1: string | number | null;
  handleArgsParam1Change: (value: string) => void;
  argsParam2: string | number | null;
  handleArgsParam2Change: (value: string) => void;

  handleConditionOperatorChange: (value: SingleValue<SelectOption>) => void;

  errors: Record<string, string>;
}

export const Condition: React.FC<ConditionProps> = (props) => {
  const {
    show,
    handleChangeConditionShow,
    isParamOneInput1,
    handleParamOneInput1,
    isParamOneInput2,
    handleParamOneInput2,

    componentOptionsParam1,
    handleComponentParam1Change,
    selectedComponentParam1,
    methodOptionsParam1,
    handleMethodParam1Change,
    selectedMethodParam1,

    conditionOperator,
    handleConditionOperatorChange,

    componentOptionsParam2,
    handleComponentParam2Change,
    selectedComponentParam2,
    methodOptionsParam2,
    handleMethodParam2Change,
    selectedMethodParam2,

    argsParam1,
    handleArgsParam1Change,
    argsParam2,
    handleArgsParam2Change,

    errors,
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
      <div className="mb-3 flex items-center gap-4">
        <p className={twMerge('min-w-11 font-bold', show && 'mt-2')}>Если</p>

        <Tabs
          className={show ? '' : 'hidden'}
          tabs={['Выбор', 'Код']}
          value={tabValue}
          onChange={handleTabChange}
        />

        <label className={twMerge('btn border-primary px-3', show && 'btn-primary mt-0')}>
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => handleChangeConditionShow(e.target.checked)}
            className="h-0 w-0 opacity-0"
          />
          <span>{show ? 'Убрать условие' : 'Добавить условие'}</span>
        </label>
      </div>

      <div className={twMerge('pl-2', !show && 'hidden')}>
        <TabPanel value={0} tabValue={tabValue}>
          <div className="flex flex-col gap-2">
            <div className="flex items-start">
              <Checkbox
                checked={!isParamOneInput1}
                onCheckedChange={(v) => handleParamOneInput1(!v)}
                className="mr-2 mt-[9px]"
              />
              {isParamOneInput1 ? (
                <div className="flex w-full gap-2">
                  <Select
                    containerClassName="w-full"
                    options={componentOptionsParam1}
                    onChange={handleComponentParam1Change}
                    value={
                      componentOptionsParam1.find((o) => o.value === selectedComponentParam1) ??
                      null
                    }
                    isSearchable={false}
                    error={errors.selectedComponentParam1 || ''}
                  />
                  <Select
                    containerClassName="w-full"
                    options={methodOptionsParam1}
                    onChange={handleMethodParam1Change}
                    value={
                      methodOptionsParam1.find((o) => o.value === selectedMethodParam1) ?? null
                    }
                    isSearchable={false}
                    error={errors.selectedMethodParam1 || ''}
                  />
                </div>
              ) : (
                <TextField
                  label=""
                  placeholder="Напишите параметр"
                  onChange={(e) => handleArgsParam1Change(e.target.value)}
                  value={argsParam1 ?? ''}
                  error={!!errors.argsParam1}
                  errorMessage={errors.argsParam1 || ''}
                />
              )}
            </div>

            <Select
              containerClassName="pl-7"
              className="max-w-[220px]"
              placeholder="Выберите оператор"
              options={operand}
              onChange={handleConditionOperatorChange}
              value={operand.find((opt) => opt.value === conditionOperator)}
              error={errors.conditionOperator || ''}
            />

            <div className="flex items-start">
              <Checkbox
                checked={!isParamOneInput2}
                onCheckedChange={(v) => handleParamOneInput2(!v)}
                className="mr-2 mt-[9px]"
              />
              {isParamOneInput2 ? (
                <div className="flex w-full gap-2">
                  <Select
                    containerClassName="w-full"
                    options={componentOptionsParam2}
                    onChange={handleComponentParam2Change}
                    value={
                      componentOptionsParam2.find((o) => o.value === selectedComponentParam2) ??
                      null
                    }
                    isSearchable={false}
                    error={errors.selectedComponentParam2 || ''}
                  />
                  <Select
                    containerClassName="w-full"
                    options={methodOptionsParam2}
                    onChange={handleMethodParam2Change}
                    value={
                      methodOptionsParam2.find((o) => o.value === selectedMethodParam2) ?? null
                    }
                    isSearchable={false}
                    error={errors.selectedMethodParam2 || ''}
                  />
                </div>
              ) : (
                <TextField
                  label=""
                  placeholder="Напишите параметр"
                  onChange={(e) => handleArgsParam2Change(e.target.value)}
                  value={argsParam2 ?? ''}
                  error={!!errors.argsParam2}
                  errorMessage={errors.argsParam2 || ''}
                />
              )}
            </div>
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
  );
};
