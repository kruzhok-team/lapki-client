import React, { useId } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow-down.svg';
import { Action, actionDescriptions, Stack } from '@renderer/lib/data/History';
import { useEditorContext } from '@renderer/store/EditorContext';

const groupByNumberOfConnectedActions = (stack: Stack) => {
  const res: Array<Action<any> | Action<any>[]> = [];

  let i = stack.length - 1;
  while (i >= 0) {
    const numberOfConnectedActions = stack[i].numberOfConnectedActions;
    if (numberOfConnectedActions) {
      const block: Action<any>[] = [];
      for (let j = 0; j < numberOfConnectedActions + 1; j++) {
        block.push(stack[i]);
        i--;
      }
      res.push(block.reverse());
    } else {
      res.push(stack[i]);
      i--;
    }
  }

  return res;
};

const HistoryItem: React.FC<{ data: Action<any>; labelClassName?: string }> = ({
  data,
  labelClassName,
}) => {
  const { type } = data;

  const id = useId();

  return (
    <div className="w-full">
      <input id={id} type="checkbox" className="peer sr-only" />
      <label
        htmlFor={id}
        className={twMerge(
          'flex w-full items-center justify-between rounded-sm p-1 peer-checked:rounded-b-none peer-checked:bg-bg-hover hover:bg-bg-hover',
          labelClassName
        )}
      >
        {actionDescriptions[type](data.args).name}
        <Arrow height={20} width={20} />
      </label>

      <div className="max-h-0 overflow-hidden rounded-b-sm bg-bg-hover transition-all peer-checked:max-h-[1000px]">
        <p className="whitespace-pre-wrap border-t border-border-primary p-1">
          {actionDescriptions[type](data.args).description}
        </p>
      </div>
    </div>
  );
};

const HistoryWithoutEditor: React.FC = () => {
  return <p>Нельзя посмотреть историю до инициализации</p>;
};

const HistoryWithEditor: React.FC = () => {
  const editor = useEditorContext();

  const { undoStack, redoStack } = editor.controller.history.use();

  return (
    <div>
      <div className="mb-4 flex gap-1">
        <button className="btn-secondary" onClick={() => editor.controller.history.undo()}>
          Назад
        </button>
        <button className="btn-secondary" onClick={() => editor.controller.history.redo()}>
          Вперёд
        </button>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Undo Stack</h3>
        <div className="h-[400px] space-y-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb scrollbar-track-rounded-full scrollbar-thumb-rounded-full">
          {groupByNumberOfConnectedActions(undoStack).map((item, i) => {
            if (Array.isArray(item)) {
              return (
                <div key={i} className="space-y-1 rounded-sm border border-border-primary p-1">
                  {item.map((data, j) => (
                    <HistoryItem key={j} data={data} />
                  ))}
                </div>
              );
            }

            return <HistoryItem key={i} data={item} labelClassName="pr-2" />;
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Redo Stack</h3>
        <div className="h-[400px] space-y-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb scrollbar-track-rounded-full scrollbar-thumb-rounded-full">
          {groupByNumberOfConnectedActions(redoStack).map((item, i) => {
            if (Array.isArray(item)) {
              return (
                <div key={i} className="space-y-1 rounded-sm border border-border-primary p-1">
                  {item.map((data, j) => (
                    <HistoryItem key={j} data={data} />
                  ))}
                </div>
              );
            }

            return <HistoryItem key={i} data={item} />;
          })}
        </div>
      </div>
    </div>
  );
};

export const History: React.FC = () => {
  const { model } = useEditorContext();
  const isMounted = model.useData('isMounted');

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        История изменений
      </h3>
      <div className="px-4">{isMounted ? <HistoryWithEditor /> : <HistoryWithoutEditor />}</div>
    </section>
  );
};
