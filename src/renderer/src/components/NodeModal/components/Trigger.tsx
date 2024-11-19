import React, { memo, useMemo, useRef } from 'react';

import CodeMirror, { Transaction, EditorState, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import throttle from 'lodash.throttle';

import { Select, TabPanel, Tabs } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

import { useTrigger } from '../hooks';

import '../style.css';

type TriggerProps = ReturnType<typeof useTrigger>;

/**
 * Виджет редактирования триггера (сигнала) события.
 *
 * Обёрнут в {@link memo}, чтобы оптимизировать перерисовку.
 */
export const Trigger: React.FC<TriggerProps> = memo(function Trigger(props) {
  const {
    componentOptions,
    methodOptions,

    tabValue,
    onTabChange,

    selectedComponent,
    selectedMethod,
    onComponentChange,
    onMethodChange,

    text,
    onChangeText,
  } = props;

  const editor = useModelContext();
  const headControllerId = editor.model.useData('', 'headControllerId');
  const controller = editor.controllers[headControllerId];
  const visual = controller.useData('visual');

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);

  const handleTabChange = (tab: number) => {

    onTabChange(tab);

    // Фокусировка и установка каретки
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

    // return tr.startState.doc.length + tr.newDoc.length < 200;
  };

  const handleChangeText = useMemo(() => throttle(onChangeText, 500), [onChangeText]);

  return (
    <div>
      <div className="mb-2 flex items-end gap-2">
        <p className="text-lg font-bold">Когда</p>

        {!visual && (
          <Tabs
            className="ml-auto"
            tabs={['Выбор', 'Код']}
            value={tabValue}
            onChange={handleTabChange}
          />
        )}
      </div>

      <div className="pl-4">
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

        {!visual && (
          <TabPanel value={1} tabValue={tabValue}>
            <CodeMirror
              ref={editorRef}
              className="editor"
              value={text}
              onChange={handleChangeText}
              placeholder={'Напишите код'}
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
