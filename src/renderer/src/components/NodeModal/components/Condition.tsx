import React, { useMemo, useRef, memo, useLayoutEffect } from 'react';

import CodeMirror, { ReactCodeMirrorRef, Transaction, EditorState } from '@uiw/react-codemirror';
import throttle from 'lodash.throttle';
import { twMerge } from 'tailwind-merge';

import { AttributeConstSwitch } from '@renderer/components/AttributeConstSwitch';
import { ParameterSelect, SubButton, TabPanel, Tabs, TextField } from '@renderer/components/UI';
import { AddButton } from '@renderer/components/UI/AddButton';
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
    condition,
    parse,

    isElse,
    handleElseChange,
  } = props;

  const editor = useModelContext();
  const headControllerId = editor.model.useData('', 'headControllerId');
  const controller = editor.controllers[headControllerId];
  const visual = controller.useData('visual');

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);

  useLayoutEffect(() => {
    parse(condition);
  }, [condition, parse]);

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
      <div className={twMerge('flex items-center justify-between', show && 'items-end')}>
        <p className="font-medium">Если</p>
        {!show ? (
          <AddButton onClick={() => handleChangeConditionShow(!show)} />
        ) : (
          <SubButton onClick={() => handleChangeConditionShow(!show)} />
        )}

        {!visual && (
          <Tabs
            className={twMerge('ml-auto', !show && 'hidden')}
            tabs={['Выбор', 'Код']}
            value={tabValue}
            onChange={handleTabChange}
          />
        )}
      </div>

      <div className={twMerge('mt-2', !show && 'hidden')}>
        <TabPanel value={0} tabValue={tabValue}>
          <div className="flex flex-col gap-2">
            {visual && (
              <div className={twMerge('flex flex-row', !show && 'hidden')}>
                <AttributeConstSwitch
                  hint="Если не выполняются другие условия для данного триггера"
                  checked={isElse}
                  onCheckedChange={handleElseChange}
                />
                <span className="ml-2">else</span>
              </div>
            )}
            <div className="flex items-start">
              <div className="ml-[37px]">
                {isParamOneInput1 ? (
                  <div className="flex gap-2">
                    <ParameterSelect
                      containerClassName={twMerge('w-[209px]', isElse && 'opacity-50')}
                      options={componentOptionsParam1}
                      onChange={handleComponentParam1Change}
                      value={
                        componentOptionsParam1.find((o) => o.value === selectedComponentParam1) ??
                        null
                      }
                      isDisabled={isElse}
                      isSearchable={false}
                      error={errors.selectedComponentParam1 || ''}
                      placeholder="Выберите компонент..."
                      noOptionsMessage={() => 'Нет подходящих компонентов'}
                    />
                    <ParameterSelect
                      containerClassName={twMerge('w-[209px]', isElse && 'opacity-50')}
                      options={methodOptionsParam1}
                      onChange={handleMethodParam1Change}
                      value={
                        methodOptionsParam1.find((o) => o.value === selectedMethodParam1) ?? null
                      }
                      isDisabled={isElse}
                      isSearchable={false}
                      error={errors.selectedMethodParam1 || ''}
                      placeholder="Выберите атрибут..."
                      noOptionsMessage={() => 'Нет подходящих атрибутов'}
                    />
                  </div>
                ) : (
                  // Старые условия с константой слева остаются редактируемыми без потери данных,
                  // но переключить новый первый аргумент в константу больше нельзя.
                  <TextField
                    label=""
                    containerClassName={twMerge(isElse && 'opacity-50')}
                    disabled={isElse}
                    placeholder="Напишите параметр"
                    onChange={(e) => handleArgsParam1Change(e.target.value)}
                    value={argsParam1 ?? ''}
                    error={!!errors.argsParam1}
                    errorMessage={errors.argsParam1 || ''}
                  />
                )}
              </div>
            </div>

            <ParameterSelect
              containerClassName={twMerge('ml-[37px] w-[61px]', isElse && 'opacity-50')}
              placeholder="Выберите оператор"
              options={operand}
              isDisabled={isElse}
              onChange={handleConditionOperatorChange}
              value={operand.find((opt) => opt.value === conditionOperator) ?? null}
              error={errors.conditionOperator || ''}
              isSearchable={false}
            />

            <div className="flex items-start">
              <div className="mr-2 mt-[6px]">
                <AttributeConstSwitch
                  checked={isParamOneInput2}
                  onCheckedChange={() => handleParamOneInput2(!isParamOneInput2)}
                  hint={
                    isParamOneInput2
                      ? 'Переключиться на константу'
                      : 'Переключиться на атрибут компонента'
                  }
                  isDisabled={isElse}
                  className={twMerge(isElse && 'cursor-default opacity-50')}
                />
              </div>
              {isParamOneInput2 ? (
                <div className="flex gap-2">
                  <ParameterSelect
                    containerClassName={twMerge('w-[209px]', isElse && 'opacity-50')}
                    options={componentOptionsParam2}
                    onChange={handleComponentParam2Change}
                    value={
                      componentOptionsParam2.find((o) => o.value === selectedComponentParam2) ??
                      null
                    }
                    isSearchable={false}
                    isDisabled={isElse}
                    error={errors.selectedComponentParam2 || ''}
                    placeholder="Выберите компонент..."
                    noOptionsMessage={() => 'Нет подходящих компонентов'}
                  />
                  <ParameterSelect
                    containerClassName={twMerge('w-[209px]', isElse && 'opacity-50')}
                    options={methodOptionsParam2}
                    onChange={handleMethodParam2Change}
                    value={
                      methodOptionsParam2.find((o) => o.value === selectedMethodParam2) ?? null
                    }
                    isDisabled={isElse}
                    isSearchable={false}
                    error={errors.selectedMethodParam2 || ''}
                    placeholder="Выберите атрибут..."
                    noOptionsMessage={() => 'Нет подходящих атрибутов'}
                  />
                </div>
              ) : (
                <TextField
                  label=""
                  containerClassName={twMerge(isElse && 'opacity-50')}
                  placeholder="Напишите параметр"
                  onChange={(e) => handleArgsParam2Change(e.target.value)}
                  value={argsParam2 ?? ''}
                  disabled={isElse}
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
