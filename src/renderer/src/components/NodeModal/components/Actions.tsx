import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import CodeMirror, { Transaction, EditorState, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import throttle from 'lodash.throttle';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ScrollArea, TabPanel, Tabs } from '@renderer/components/UI';
import { AddButton } from '@renderer/components/UI/AddButton';
import { Action as ActionData, EventData } from '@renderer/types/diagram';

import { Action } from './Action';
import { InlineAction, InlineActionHandle } from './InlineAction';

import { useActions } from '../hooks';

type ActionsProps = ReturnType<typeof useActions> & {
  event: EventData | null | undefined;
  disabled?: boolean;
  onAddAction?: () => void;
  onChangeAction?: (action: ActionData) => void;
  inlineEditing?: boolean;
  expandedActionRequest?: { index: number; requestId: number } | null;
};

export interface ActionsHandle {
  validate: () => ActionData[] | null;
  collapseAll: () => void;
}

interface InlineActionRow {
  id: number;
  action?: ActionData;
}

/**
 * Блок действия в модалках редактирования нод
 */
export const Actions = forwardRef<ActionsHandle, ActionsProps>((props, ref) => {
  const {
    tabValue,
    onTabChange,
    actions,
    onAddAction,
    onChangeAction,
    onDeleteAction,
    onReorderAction,
    smId,
    controller,
    text,
    onChangeText,
    getComponentName,
    setActions,
    event,
    parse,
    disabled,
    inlineEditing = false,
    expandedActionRequest,
  } = props;
  const visual = controller.useData('visual');

  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const nextInlineActionId = useRef(0);
  const [inlineRows, setInlineRows] = useState<InlineActionRow[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
  const inlineActionRefs = useRef(new Map<number, InlineActionHandle>());
  const inlineRowElements = useRef(new Map<number, HTMLDivElement>());
  const handledActionRequestId = useRef<number | null>(null);

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const actionsViewportRef = useRef<HTMLDivElement | null>(null);

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

  useLayoutEffect(() => {
    if (actionsViewportRef.current) {
      actionsViewportRef.current.scrollTop = 0;
    }
    event && parse(smId, event.do);
    if (inlineEditing) {
      const eventActions = event && Array.isArray(event.do) ? event.do : [];
      const nextRows = eventActions.map((action) => ({
        id: nextInlineActionId.current++,
        action,
      }));
      setInlineRows(nextRows);
      const requestedRow =
        expandedActionRequest && nextRows[expandedActionRequest.index]
          ? nextRows[expandedActionRequest.index]
          : undefined;
      setExpandedRowIds(requestedRow ? new Set([requestedRow.id]) : new Set());
      handledActionRequestId.current = expandedActionRequest?.requestId ?? null;
      if (requestedRow) {
        requestAnimationFrame(() =>
          inlineRowElements.current.get(requestedRow.id)?.scrollIntoView({ block: 'nearest' })
        );
      }
    }
    // setActions(event && typeof event.do !== 'string' ? event.do : []);
    // Черновики пересоздаются только при смене события. Запрос раскрытия обрабатывается ниже,
    // иначе клик по действию сбросит уже внесённые inline-изменения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, inlineEditing, setActions]);

  useLayoutEffect(() => {
    if (!inlineEditing || !expandedActionRequest) return;
    if (handledActionRequestId.current === expandedActionRequest.requestId) return;
    const row = inlineRows[expandedActionRequest.index];
    if (!row) return;

    handledActionRequestId.current = expandedActionRequest.requestId;
    setExpandedRowIds(new Set([row.id]));
    requestAnimationFrame(() =>
      inlineRowElements.current.get(row.id)?.scrollIntoView({ block: 'nearest' })
    );
  }, [expandedActionRequest, inlineEditing, inlineRows]);

  const handleChangeText = useMemo(() => throttle(onChangeText, 500), [onChangeText]);

  const handleDrag = (index: number) => setDragIndex(index);

  const handleDrop = (index: number) => {
    if (dragIndex === null) return;

    if (inlineEditing) {
      setInlineRows((current) => {
        const next = [...current];
        [next[dragIndex], next[index]] = [next[index], next[dragIndex]];
        return next;
      });
    } else {
      onReorderAction(dragIndex, index);
    }
    setDragIndex(null);
  };

  const handleClickDelete = (idx: number) => {
    if (idx === null) return;

    if (inlineEditing) {
      const deletedId = inlineRows[idx]?.id;
      setInlineRows((current) => current.filter((_, index) => index !== idx));
      if (deletedId !== undefined) {
        inlineActionRefs.current.delete(deletedId);
        inlineRowElements.current.delete(deletedId);
        setExpandedRowIds((current) => {
          const next = new Set(current);
          next.delete(deletedId);
          return next;
        });
      }
    } else {
      onDeleteAction(idx);
    }
  };

  const addInlineAction = () => {
    const id = nextInlineActionId.current++;
    setInlineRows((current) => [...current, { id }]);
    setExpandedRowIds(new Set([id]));
    requestAnimationFrame(() =>
      inlineRowElements.current.get(id)?.scrollIntoView({ block: 'nearest' })
    );
  };

  const validateInlineActions = (): ActionData[] | null => {
    if (!inlineEditing) return actions;

    const invalidRowIds = new Set<number>();
    const validatedActions: ActionData[] = [];
    inlineRows.forEach((row) => {
      const action = inlineActionRefs.current.get(row.id)?.validate();
      if (action) validatedActions.push(action);
      else invalidRowIds.add(row.id);
    });

    if (invalidRowIds.size > 0) {
      setExpandedRowIds(invalidRowIds);
      requestAnimationFrame(() => {
        const firstInvalidId = inlineRows.find((row) => invalidRowIds.has(row.id))?.id;
        if (firstInvalidId !== undefined) {
          inlineRowElements.current.get(firstInvalidId)?.scrollIntoView({ block: 'nearest' });
        }
      });
      return null;
    }

    setActions(validatedActions);
    return validatedActions;
  };

  useImperativeHandle(ref, () => ({
    validate: validateInlineActions,
    collapseAll: () => setExpandedRowIds(new Set()),
  }));

  return (
    <div
      className={twMerge(
        'flex min-h-0 grow flex-col',
        inlineEditing && expandedRowIds.size > 0 ? 'h-[580px]' : 'h-[290px]'
      )}
    >
      <div className="mb-2 flex items-end gap-2">
        <p className="font-medium">Делай</p>

        {!visual && (
          <Tabs
            className="ml-auto"
            tabs={['Выбор', 'Код']}
            value={tabValue}
            onChange={handleTabChange}
          />
        )}
        <AddButton onClick={inlineEditing ? addInlineAction : onAddAction} disabled={disabled} />
      </div>

      <div className="h-full min-h-0 flex-1">
        <TabPanel value={0} tabValue={tabValue} className="h-full">
          <div
            onDoubleClick={disabled ? undefined : inlineEditing ? addInlineAction : onAddAction}
            className="flex h-full min-h-0  flex-1 gap-2"
          >
            <ScrollArea
              ref={actionsViewportRef}
              className="w-full rounded-lg border border-border-primary py-0"
              viewportClassName="whitespace-nowrap"
              contentClassName="h-full min-w-full"
            >
              {(inlineEditing ? inlineRows.length : actions.length) === 0 ? (
                <div className="flex h-full w-full select-none flex-col items-center justify-center text-center text-text-inactive">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">Чтобы добавить действие, нажмите</span>
                    <AddIcon className="opacity-60" />
                  </div>
                  <div className="mt-1">или нажмите дважды по этому полю</div>
                </div>
              ) : (
                <div className={inlineEditing ? 'grid min-w-full' : 'grid w-max min-w-full'}>
                  {inlineEditing
                    ? inlineRows.map((row, i) => (
                        <div
                          key={row.id}
                          onDoubleClick={(event) => event.stopPropagation()}
                          ref={(element) => {
                            if (element) inlineRowElements.current.set(row.id, element);
                            else inlineRowElements.current.delete(row.id);
                          }}
                        >
                          <InlineAction
                            ref={(handle) => {
                              if (handle) inlineActionRefs.current.set(row.id, handle);
                              else inlineActionRefs.current.delete(row.id);
                            }}
                            smId={smId}
                            controller={controller}
                            action={row.action}
                            componentName={(component) => getComponentName(component) ?? component}
                            expanded={expandedRowIds.has(row.id)}
                            onToggle={() => {
                              setExpandedRowIds((current) => {
                                if (current.has(row.id)) {
                                  const next = new Set(current);
                                  next.delete(row.id);
                                  return next;
                                }
                                return new Set([row.id]);
                              });
                            }}
                            onDelete={() => handleClickDelete(i)}
                            onDragStart={() => handleDrag(i)}
                            onDrop={() => handleDrop(i)}
                          />
                        </div>
                      ))
                    : actions.map((data, i) => (
                        <Action
                          key={i}
                          smId={smId}
                          isSelected={selectedActionIndex === i}
                          onSelect={() => setSelectedActionIndex(i)}
                          onChange={() => !disabled && onChangeAction?.(data)}
                          onDelete={() => handleClickDelete(i)}
                          onDragStart={() => handleDrag(i)}
                          onDrop={() => handleDrop(i)}
                          data={{
                            ...data,
                            componentName: getComponentName(data.component) ?? data.component,
                          }}
                        />
                      ))}
                </div>
              )}
            </ScrollArea>
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

Actions.displayName = 'Actions';
