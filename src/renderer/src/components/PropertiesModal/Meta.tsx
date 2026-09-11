import React, { useEffect, useRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { AddButton, ScrollArea } from '@renderer/components/UI';
import { DeleteButton } from '@renderer/components/UI/DeleteButton';

import { MetadataDraftRow, MetadataFieldErrors } from './metadataDrafts';

interface MetaProps {
  rows: MetadataDraftRow[];
  errors: Record<string, MetadataFieldErrors>;
  canAdd: boolean;
  focusRowId: string | null;
  onAdd: () => void;
  onChange: (rowId: string, field: 'name' | 'value', value: string) => void;
  onDelete: (rowId: string) => void;
  onFocusHandled: () => void;
}

const cellClassName =
  'min-h-9 border-b border-r border-border-primary px-[9px] py-[6px] align-top text-text-primary outline-none transition-colors';

export const Meta: React.FC<MetaProps> = ({
  rows,
  errors,
  canAdd,
  focusRowId,
  onAdd,
  onChange,
  onDelete,
  onFocusHandled,
}) => {
  const nameInputRefs = useRef(new Map<string, HTMLInputElement>());
  useEffect(() => {
    if (!focusRowId) return;

    const input = nameInputRefs.current.get(focusRowId);
    if (!input) return;

    input.focus();
    input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    onFocusHandled();
  }, [focusRowId, onFocusHandled]);

  return (
    <section className="mt-3">
      <div className="mb-3 flex w-fit items-center gap-3">
        <h2 className="font-medium">Метаданные</h2>
        {canAdd && <AddButton aria-label="Добавить метаданные" onClick={onAdd} />}
      </div>

      {rows.length === 0 ? (
        <p className="text-text-inactive">Метаданных нет</p>
      ) : (
        <ScrollArea className="max-h-60 py-0">
          <table className="w-full min-w-max table-auto border-separate border-spacing-0">
            <tbody>
              {rows.map((row, index) => {
                const rowErrors = errors[row.id] ?? {};
                const isFirst = index === 0;
                const isLast = index === rows.length - 1;

                return (
                  <tr key={row.id}>
                    <td
                      className={twMerge(
                        cellClassName,
                        'border-l font-medium',
                        isFirst && 'rounded-tl-[6px] border-t',
                        isLast && 'rounded-bl-[6px]',
                        rowErrors.name && 'border-error text-error'
                      )}
                    >
                      <div className="grid min-w-0">
                        <span
                          aria-hidden
                          className="invisible col-start-1 row-start-1 whitespace-pre"
                        >
                          {row.name || 'Название'}
                        </span>
                        <input
                          ref={(node) => {
                            if (node) nameInputRefs.current.set(row.id, node);
                            else nameInputRefs.current.delete(row.id);
                          }}
                          aria-invalid={!!rowErrors.name}
                          aria-label="Название метаданных"
                          className="col-start-1 row-start-1 block min-h-6 w-full min-w-0 bg-transparent font-medium text-inherit outline-none placeholder:text-text-inactive"
                          value={row.name}
                          placeholder="Название"
                          onChange={(event) => onChange(row.id, 'name', event.target.value)}
                        />
                      </div>
                      {rowErrors.name && (
                        <p className="text-xs font-normal text-error">{rowErrors.name}</p>
                      )}
                    </td>

                    <td
                      className={twMerge(
                        cellClassName,
                        isFirst && 'rounded-tr-[6px] border-t',
                        isLast && 'rounded-br-[6px]',
                        rowErrors.value && 'border-error text-error'
                      )}
                    >
                      <input
                        aria-invalid={!!rowErrors.value}
                        aria-label="Значение метаданных"
                        className="block min-h-6 w-full min-w-[250px] bg-transparent text-inherit outline-none placeholder:text-text-inactive"
                        value={row.value}
                        placeholder="Значение"
                        onChange={(event) => onChange(row.id, 'value', event.target.value)}
                      />
                      {rowErrors.value && <p className="text-xs text-error">{rowErrors.value}</p>}
                    </td>

                    <td className="pl-3 align-top">
                      <div className="flex min-h-9 items-center">
                        <DeleteButton
                          aria-label="Удалить метаданные"
                          onClick={() => onDelete(row.id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </section>
  );
};
