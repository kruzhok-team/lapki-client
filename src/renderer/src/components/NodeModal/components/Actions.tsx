import React, { useMemo, useRef, useState } from 'react';

import CodeMirror, { Transaction, EditorState, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import throttle from 'lodash.throttle';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { ActionsModal } from '@renderer/components';
import { TabPanel, Tabs } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

import { Action } from './Action';

import { useActions } from '../hooks';

type ActionsProps = ReturnType<typeof useActions>;

/**
 * Блок действия в модалках редактирования нод
 */
export const Actions: React.FC<ActionsProps> = (props) => {
  const {
    tabValue,
    onTabChange,
    actions,
    onAddAction,
    onChangeAction,
    onDeleteAction,
    onReorderAction,
    modal,
    text,
    onChangeText,
  } = props;

  const editor = useModelContext();
  const headControllerId = editor.model.useData('', 'headControllerId');
  const controller = editor.controllers[headControllerId];
  const visual = controller.useData('visual');

  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  const handleDrag = (index: number) => setDragIndex(index);

  const handleDrop = (index: number) => {
    if (dragIndex === null) return;

    onReorderAction(dragIndex, index);
  };

  const handleClickDelete = () => {
    if (selectedActionIndex === null) return;

    onDeleteAction(selectedActionIndex);
  };

  return (
    <div>
      <div className="mb-2 flex items-end gap-2">
        <p className="text-lg font-bold">Делай</p>

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
          <div className="flex gap-2">
            <div className="flex h-44 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
              {actions.length === 0 && <div className="mx-2 my-2 flex">(нет действий)</div>}

              {actions.map((data, i) => (
                <Action
                  key={i}
                  isSelected={selectedActionIndex === i}
                  onSelect={() => setSelectedActionIndex(i)}
                  onChange={() => onChangeAction(data)}
                  onDragStart={() => handleDrag(i)}
                  onDrop={() => handleDrop(i)}
                  data={data}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button type="button" className="btn-secondary p-1" onClick={onAddAction}>
                <AddIcon />
              </button>
              <button type="button" className="btn-secondary p-1" onClick={handleClickDelete}>
                <SubtractIcon />
              </button>
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

      <ActionsModal {...modal} />
    </div>
  );
};
