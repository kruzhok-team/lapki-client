import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { ParameterSelect } from '@renderer/components/UI';
import { DeleteButton } from '@renderer/components/UI/DeleteButton';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { Action as ActionData } from '@renderer/types/diagram';
import { isMatrix } from '@renderer/utils';

import { ActionSummary } from './Action';

import { ActionsModalParameters } from '../ActionsModal/ActionsModalParameters';
import { useActionsModal } from '../hooks/useActionModal';

export interface InlineActionHandle {
  validate: () => ActionData | undefined;
}

interface InlineActionProps {
  rowId: number;
  smId: string;
  controller: CanvasController;
  action?: ActionData;
  componentName: (component: string) => string;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onMatrixParameterChange: (rowId: number, hasMatrix: boolean) => void;
}

export const InlineAction = forwardRef<InlineActionHandle, InlineActionProps>(
  (
    {
      smId,
      rowId,
      controller,
      action,
      componentName,
      expanded,
      onToggle,
      onDelete,
      onDragStart,
      onDrop,
      onMatrixParameterChange,
    },
    ref
  ) => {
    const initialData = useMemo(
      () => (action ? { smId, action, isEditingEvent: false } : undefined),
      [action, smId]
    );
    const editor = useActionsModal(smId, controller, undefined, undefined, initialData);
    const hasMatrixParameter = editor.protoParameters.some(
      ({ type }) => typeof type === 'string' && isMatrix(type)
    );

    useEffect(() => {
      onMatrixParameterChange(rowId, hasMatrixParameter);
      return () => onMatrixParameterChange(rowId, false);
    }, [hasMatrixParameter, onMatrixParameterChange, rowId]);

    useImperativeHandle(ref, () => ({ validate: editor.validate }), [editor.validate]);

    const currentAction =
      editor.selectedComponent && editor.selectedMethod
        ? {
            component: editor.selectedComponent,
            method: editor.selectedMethod,
            args: editor.parameters,
          }
        : undefined;

    return (
      <div className={twMerge('rounded-lg px-3 py-2', !expanded && 'hover:bg-bg-hover')}>
        <div
          className={twMerge(
            'grid min-w-0 grid-cols-[10px_minmax(0,1fr)_max-content]',
            expanded ? 'items-start' : 'items-center'
          )}
        >
          <button
            className={twMerge(
              'flex h-[10px] w-[10px] items-center justify-center',
              expanded && 'mt-[11px] self-start'
            )}
            type="button"
            onClick={onToggle}
            aria-label={expanded ? 'Свернуть действие' : 'Развернуть действие'}
            aria-expanded={expanded}
          >
            <ArrowIcon
              className={
                expanded ? 'rotate-0 transition-transform' : '-rotate-90 transition-transform'
              }
            />
          </button>

          <div className="ml-3 min-w-0">
            {expanded ? (
              <div className="min-w-0">
                <div className="grid min-w-0 grid-cols-2 items-start gap-3">
                  <div className="min-w-0">
                    <ParameterSelect
                      className="w-full"
                      options={editor.componentOptions}
                      value={
                        editor.componentOptions.find(
                          (option) => option.value === editor.selectedComponent
                        ) ?? null
                      }
                      onChange={editor.handleComponentChange}
                      placeholder="Выберите компонент..."
                      isClearable={false}
                      isSearchable={false}
                      noOptionsMessage={() => <div>Отсутствуют подходящие компоненты</div>}
                    />
                    {editor.selectionErrors.component && (
                      <div className="mt-1 text-xs text-error">
                        {editor.selectionErrors.component}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <ParameterSelect
                      className="w-full"
                      options={editor.methodOptions}
                      value={
                        editor.methodOptions.find(
                          (option) => option.value === editor.selectedMethod
                        ) ?? null
                      }
                      onChange={editor.handleMethodChange}
                      placeholder="Выберите действие..."
                      isClearable={false}
                      isSearchable={false}
                      noOptionsMessage={() => (
                        <div>
                          У компонента отсутствуют действия <br /> Выберите другой компонент
                        </div>
                      )}
                    />
                    {editor.selectionErrors.method && (
                      <div className="mt-1 text-xs text-error">{editor.selectionErrors.method}</div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <ActionsModalParameters
                    protoParameters={editor.protoParameters}
                    parameters={editor.parameters}
                    setParameters={editor.setParameters}
                    errors={editor.errors}
                    setErrors={editor.setErrors}
                    componentOptions={editor.componentWithVariablesOptions}
                    controller={controller}
                    smId={smId}
                    attributeOptionsSearch={editor.attributeOptionsSearch}
                    scrollable={false}
                  />
                </div>
              </div>
            ) : currentAction ? (
              <div
                className="flex min-w-0 cursor-grab items-center gap-2 overflow-hidden py-1"
                draggable
                onDragOver={(event) => event.preventDefault()}
                onDragStart={onDragStart}
                onDrop={onDrop}
              >
                <ActionSummary
                  smId={smId}
                  data={{
                    ...currentAction,
                    componentName: componentName(currentAction.component),
                  }}
                />
              </div>
            ) : (
              <div
                className="cursor-grab py-1 text-text-inactive"
                draggable
                onDragOver={(event) => event.preventDefault()}
                onDragStart={onDragStart}
                onDrop={onDrop}
              >
                Действие не заполнено
              </div>
            )}
          </div>

          <div className={twMerge('ml-2', expanded && 'self-start')}>
            <DeleteButton
              onClick={onDelete}
              className="shrink-0 p-2"
              aria-label="Удалить действие"
            />
          </div>
        </div>
      </div>
    );
  }
);

InlineAction.displayName = 'InlineAction';
