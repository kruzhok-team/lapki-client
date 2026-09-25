import React, { useId, useState } from 'react';

import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow-down.svg';
import { ReactComponent as ExportIcon } from '@renderer/assets/icons/download-bin.svg';
import { ReactComponent as RedoIcon } from '@renderer/assets/icons/redo.svg';
import { actionDescriptions, Stack } from '@renderer/lib/data/History';
import { useModelContext } from '@renderer/store/ModelContext';

type HistorySection = 'undo' | 'redo';
type HistoryAction = Stack[number];
type HistoryGroup = HistoryAction | HistoryAction[];

const groupByNumberOfConnectedActions = (stack: Stack): HistoryGroup[] => {
  const result: HistoryGroup[] = [];

  let i = stack.length - 1;
  while (i >= 0) {
    const numberOfConnectedActions = stack[i].numberOfConnectedActions;
    if (numberOfConnectedActions) {
      const block: HistoryAction[] = [];
      for (let j = 0; j < numberOfConnectedActions + 1; j++) {
        block.push(stack[i]);
        i--;
      }
      result.push(block.reverse());
    } else {
      result.push(stack[i]);
      i--;
    }
  }

  return result;
};

const HistoryItem: React.FC<{ data: HistoryAction }> = ({ data }) => {
  const id = useId();
  const description = actionDescriptions[data.type](data.args);

  return (
    <div className="overflow-hidden rounded-lg border border-border-primary bg-white">
      <input id={id} type="checkbox" className="peer sr-only" />
      <label
        htmlFor={id}
        className="flex min-h-9 w-full cursor-pointer items-center gap-2 px-3 py-2 peer-focus-visible:ring-1 peer-focus-visible:ring-inset peer-focus-visible:ring-primary peer-checked:[&>svg]:rotate-180"
      >
        <span className="min-w-0 flex-1 break-words font-medium">{description.name}</span>
        <Arrow className="size-4 shrink-0 transition-transform" />
      </label>

      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] peer-checked:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <p className="whitespace-pre-wrap break-words border-t border-border-primary px-3 py-2 leading-4 text-text-inactive">
            {description.description}
          </p>
        </div>
      </div>
    </div>
  );
};

const HistoryList: React.FC<{ stack: Stack; emptyText: string }> = ({ stack, emptyText }) => {
  const groups = groupByNumberOfConnectedActions(stack);

  if (groups.length === 0) {
    return (
      <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border-primary px-6 text-center text-text-inactive">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((item, i) =>
        Array.isArray(item) ? (
          <div key={i} className="space-y-1 rounded-lg border border-border-primary p-1">
            {item.map((data, j) => (
              <HistoryItem key={j} data={data} />
            ))}
          </div>
        ) : (
          <HistoryItem key={i} data={item} />
        )
      )}
    </div>
  );
};

const HistoryWithEditor: React.FC = () => {
  const modelController = useModelContext();
  const { undoStack, redoStack } = modelController.history.use();
  const [activeSection, setActiveSection] = useState<HistorySection>('undo');

  const exportHistory = async () => {
    const json = JSON.stringify({
      undo: undoStack,
      redo: redoStack,
    });
    const [isCanceled, , err] = await window.api.fileHandlers.saveAsFile('history', json, [
      { name: 'json', extensions: ['json'] },
    ]);
    if (!isCanceled && err !== null) {
      toast.error(`Ошибка экспорта истории изменений: ${err}`);
    }
  };

  const actionButtonClass =
    'btn-secondary flex h-8 min-w-0 flex-1 items-center justify-center gap-2 px-3 py-1.5';

  return (
    <div className="flex min-h-0 flex-col">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={actionButtonClass}
          disabled={undoStack.length === 0}
          onClick={modelController.history.undo}
        >
          <RedoIcon className="horizontal-flip h-4 w-3" />
          Назад
        </button>
        <button
          type="button"
          className={actionButtonClass}
          disabled={redoStack.length === 0}
          onClick={modelController.history.redo}
        >
          <RedoIcon className="h-4 w-3" />
          Вперёд
        </button>
      </div>

      <button
        type="button"
        className="btn-primary mt-2 flex h-8 w-full items-center justify-center gap-2 px-3 py-1.5"
        onClick={exportHistory}
      >
        <ExportIcon className="size-4" />
        Экспортировать историю
      </button>

      <div
        className="mt-4 grid grid-cols-2 border-b border-border-primary"
        role="tablist"
        aria-label="Разделы истории изменений"
      >
        {(
          [
            ['undo', 'Выполнено', undoStack.length],
            ['redo', 'Отменено', redoStack.length],
          ] as const
        ).map(([section, label, count]) => (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={activeSection === section}
            className={twMerge(
              '-mb-px flex h-8 items-center justify-center gap-2 border-b px-2',
              activeSection === section
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-text-inactive'
            )}
            onClick={() => setActiveSection(section)}
          >
            {label}
            <span
              className={twMerge(
                'min-w-5 rounded-full bg-bg-hover px-1.5 py-0.5 text-[10px] leading-none text-text-inactive',
                activeSection === section && 'bg-primary text-text-secondary'
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <div
        className="mt-3 max-h-[min(420px,calc(100vh-220px))] min-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        role="tabpanel"
      >
        {activeSection === 'undo' ? (
          <HistoryList stack={undoStack} emptyText="Здесь появятся выполненные действия" />
        ) : (
          <HistoryList stack={redoStack} emptyText="Отменённых действий пока нет" />
        )}
      </div>
    </div>
  );
};

export const History: React.FC = () => {
  const modelController = useModelContext();
  const isInitialized = modelController.model.useData('', 'isInitialized');

  return (
    <section className="flex min-h-0 flex-col p-4">
      <div className="mb-4 border-b border-border-primary pb-3">
        <h2 className="h2-header">История изменений</h2>
        <p className="mt-1 text-text-inactive">Последние действия в текущей диаграмме</p>
      </div>
      {isInitialized ? (
        <HistoryWithEditor />
      ) : (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border-primary px-6 text-center text-text-inactive">
          Откройте или создайте диаграмму, чтобы увидеть историю изменений
        </div>
      )}
    </section>
  );
};
