import React, { useMemo, useRef, memo } from 'react';

import CodeMirror, { ReactCodeMirrorRef, Transaction, EditorState } from '@uiw/react-codemirror';
import throttle from 'lodash.throttle';
import { twMerge } from 'tailwind-merge';

import { Checkbox, Select, TabPanel, Tabs, TextField } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

import { useCondition } from '../hooks';

import '../style.css';

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

type ConditionProps = ReturnType<typeof useCondition>;

/**
 * Виджет редактирования условия события.
 *
 * Обёрнут в {@link memo}, чтобы оптимизировать перерисовку.
 */
export const Condition: React.FC<ConditionProps> = memo(function Condition(props) {
  const {
    show,
    handleChangeConditionShow,

    tabValue,
    onTabChange,

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

    text,
    onChangeText,

    errors,
  } = props;

  const editor = useModelContext();
  const headControllerId = editor.model.useData('', 'headControllerId');
  const controller = editor.controllers[headControllerId];
  const visual = controller.useData('visual');

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);

  const handleTabChange = (tab: number) => {
    onTabChange(tab);

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

  const handleChangeText = useMemo(() => throttle(onChangeText, 500), [onChangeText]);

  return (
    <div>
      <div className={twMerge('flex items-center gap-2', show && 'items-end')}>
        <p className="text-lg font-bold">Если</p>

        <label className={twMerge('btn border-primary px-3', show && 'btn-primary')}>
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => handleChangeConditionShow(e.target.checked)}
            className="h-0 w-0 opacity-0"
          />
          <span>{show ? 'Убрать условие' : 'Добавить условие'}</span>
        </label>

        {!visual && (
          <Tabs
            className={twMerge('ml-auto', !show && 'hidden')}
            tabs={['Выбор', 'Код']}
            value={tabValue}
            onChange={handleTabChange}
          />
        )}
      </div>

      <div className={twMerge('mt-2 pl-4', !show && 'hidden')}>
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
              value={operand.find((opt) => opt.value === conditionOperator) ?? null}
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

        {!visual && (
          <TabPanel value={1} tabValue={tabValue}>
            <CodeMirror
              ref={editorRef}
              value={text}
              onChange={handleChangeText}
              placeholder={'Напишите код'}
              className="editor"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
              }}
              width="100%"
              extensions={[EditorState.changeFilter.of(handleLengthLimit)]}
            />
          </TabPanel>
        )}
      </div>
    </div>
  );
});
