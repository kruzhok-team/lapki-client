import React, { useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { ReactComponent as GardenerIcon } from '@renderer/assets/icons/gardener.svg';
import { ReactComponent as ReaderIcon } from '@renderer/assets/icons/reader.svg';
import { Filter } from '@renderer/components/Hierarchy/Filter';
import { InterpreterClient } from '@renderer/components/Modules/Interpreter';
import { CloseButton } from '@renderer/components/UI/Modal/CloseButton';
import { useSimulatorWindow } from '@renderer/store/useSimulatorWindow';
import { getActiveTask, useTasks } from '@renderer/store/useTasks';

import { filterTasks } from './filterTasks';

import type { CatalogTask } from '../../../../common/tasks';

const platformIcons = {
  'junior-gardener': GardenerIcon,
  'junior-reader': ReaderIcon,
};

const inlineText = (text: string): React.ReactNode[] =>
  text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );

const MarkdownDescription: React.FC<{
  task: CatalogTask;
  assetRootUrl: string;
}> = ({ task, assetRootUrl }) => {
  const imagePattern = /^!\[([^\]]*)\]\(([^)]+)\)$/;
  const descriptionLines = task.description.split('\n');
  const firstContentLineIndex = descriptionLines.findIndex((line) => line.trim());
  const hasTitle = descriptionLines[firstContentLineIndex]?.trim().startsWith('# ');
  const bodyStartIndex = hasTitle
    ? descriptionLines.findIndex(
        (line, index) => index > firstContentLineIndex && line.trim() !== ''
      )
    : 0;
  const bodyLines = hasTitle
    ? descriptionLines.slice(bodyStartIndex === -1 ? descriptionLines.length : bodyStartIndex)
    : descriptionLines;

  return (
    <div className="space-y-2 text-xs leading-5">
      {bodyLines.map((rawLine, index) => {
        const line = rawLine.trim();
        const image = line.match(imagePattern);
        if (image) {
          try {
            const source = new URL(image[2], task.assetBaseUrl).toString();
            if (!assetRootUrl || !source.startsWith(assetRootUrl)) {
              return (
                <p key={index} className="text-error">
                  Недоступное изображение: {image[2]}
                </p>
              );
            }
            return <img key={index} src={source} alt={image[1]} className="max-w-full rounded" />;
          } catch {
            return (
              <p key={index} className="text-error">
                Некорректное изображение: {image[2]}
              </p>
            );
          }
        }
        if (line.startsWith('# '))
          return (
            <h2 key={index} className="h2-header">
              {inlineText(line.slice(2))}
            </h2>
          );
        if (line.startsWith('## '))
          return (
            <h3 key={index} className="h2-header">
              {inlineText(line.slice(3))}
            </h3>
          );
        if (line.startsWith('- '))
          return (
            <div key={index} className="ml-4 before:mr-2 before:content-['•']">
              {inlineText(line.slice(2))}
            </div>
          );
        return line ? <p key={index}>{inlineText(line)}</p> : <div key={index} className="h-1" />;
      })}
    </div>
  );
};

interface TaskBookProps {
  canCollapse: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export const TaskBook: React.FC<TaskBookProps> = ({
  canCollapse,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) => {
  const [
    catalog,
    catalogLoaded,
    activeTask,
    testStates,
    submissionActive,
    submissionResult,
    startTask,
    endTask,
  ] = useTasks((state) => [
    state.catalog,
    state.catalogLoaded,
    getActiveTask(state),
    state.testStates,
    state.submissionActive,
    state.submissionResult,
    state.startTask,
    state.endTask,
  ]);
  const openSimulator = useSimulatorWindow((state) => state.open);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (selectedTaskId && !catalog.tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(undefined);
    }
  }, [catalog.tasks, selectedTaskId]);

  const selectedTask = catalog.tasks.find((task) => task.id === selectedTaskId);
  const filteredTasks = useMemo(() => filterTasks(catalog.tasks, search), [catalog.tasks, search]);
  const hasResults = useMemo(
    () =>
      submissionResult !== undefined ||
      Object.values(testStates).some((state) => state.phase !== 'idle'),
    [submissionResult, testStates]
  );

  const solve = () => {
    if (submissionActive) return;
    if (InterpreterClient.activeRunId) {
      toast.warning('Сначала завершите или отмените активный запуск');
      return;
    }
    if (!selectedTask) return;
    if (
      activeTask &&
      activeTask.id !== selectedTask.id &&
      hasResults &&
      !window.confirm('Результаты текущей задачи будут потеряны. Продолжить?')
    ) {
      return;
    }
    startTask(selectedTask.id);
    openSimulator();
  };

  const finishTask = () => {
    if (InterpreterClient.activeRunId) {
      toast.warning('Сначала завершите или отмените активный запуск');
      return;
    }
    endTask();
  };

  return (
    <section
      className={twMerge(
        'flex h-full min-h-0 flex-col bg-bg-primary px-3 text-xs',
        !isCollapsed && 'pb-3 pt-2'
      )}
    >
      <div
        className={twMerge('flex items-center justify-between', isCollapsed ? 'pb-1' : 'mb-3 mt-2')}
      >
        {canCollapse ? (
          <button
            type="button"
            className="flex h-11 items-center"
            aria-label={isCollapsed ? 'Развернуть задачник' : 'Свернуть задачник'}
            onClick={onToggleCollapse}
          >
            <ArrowIcon
              className={twMerge(
                'size-3 rotate-0 transition-transform',
                isCollapsed && '-rotate-90'
              )}
            />
            <h1 className="h2-header ml-1 text-left">Задачник</h1>
          </button>
        ) : (
          <h1 className="h2-header text-left">Задачник</h1>
        )}
        {!isCollapsed && <CloseButton aria-label="Закрыть задачник" onClick={onClose} />}
      </div>

      {!isCollapsed && (
        <>
          <Filter
            className="mb-3 pb-0"
            search={search}
            onChangeSearch={setSearch}
            disabled={!catalogLoaded}
            fullWidth
          />

          {!catalogLoaded && <p className="text-xs text-text-inactive">Загрузка задач...</p>}
          {catalogLoaded && catalog.tasks.length === 0 && (
            <p className="text-xs text-text-inactive">В resources/tasks нет доступных задач.</p>
          )}
          {catalogLoaded && catalog.tasks.length > 0 && filteredTasks.length === 0 && (
            <p className="text-xs text-text-inactive">Задачи не найдены</p>
          )}

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const isActive = activeTask?.id === task.id;
              const isHighlighted = isSelected || isActive;
              const PlatformIcon = platformIcons[task.platformId];

              return (
                <article
                  key={task.id}
                  className={twMerge(
                    'rounded-lg border border-border-primary',
                    isHighlighted && 'border-icon-hover'
                  )}
                >
                  <button
                    type="button"
                    className="w-full p-3 text-left"
                    aria-expanded={isSelected}
                    onClick={() => setSelectedTaskId(isSelected ? undefined : task.id)}
                  >
                    <div className="flex items-center gap-2">
                      <PlatformIcon
                        className={twMerge(
                          'size-5 shrink-0',
                          isHighlighted &&
                            (task.platformId === 'junior-gardener'
                              ? '[&_circle]:stroke-icon-hover [&_path]:fill-icon-hover'
                              : '[&_path]:fill-icon-hover [&_path]:stroke-icon-hover')
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{task.title}</span>
                          {isActive && <span className="text-xs text-primary">решается</span>}
                        </div>
                        <p className="mt-1 text-xs text-text-inactive">{task.summary}</p>
                      </div>
                    </div>
                  </button>

                  <div
                    className={twMerge(
                      'grid transition-[grid-template-rows] duration-200 ease-out',
                      isSelected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                    aria-hidden={!isSelected}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-3 border-t border-border-primary" />
                      <div className="p-3">
                        <MarkdownDescription task={task} assetRootUrl={catalog.assetRootUrl} />
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={submissionActive}
                            tabIndex={isSelected ? undefined : -1}
                            onClick={isActive ? finishTask : solve}
                          >
                            {isActive ? 'Завершить задачу' : 'Решать задачу'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {catalog.diagnostics.length > 0 && (
            <details className="mt-3 rounded border border-error p-2 text-xs">
              <summary>Ошибки файлов задач: {catalog.diagnostics.length}</summary>
              <ul className="mt-2 space-y-1">
                {catalog.diagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.file}-${index}`}>
                    {diagnostic.file}: {diagnostic.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
};
