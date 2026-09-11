import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Modal, ParameterSelect, ParameterSelectOption } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';
import { dateFormatTimeAndDate } from '@renderer/utils';

import { Meta } from './Meta';
import {
  areMetadataEqual,
  createMetadataDrafts,
  MetadataDraftErrors,
  MetadataDrafts,
  metadataDraftToMeta,
  validateMetadataDrafts,
} from './metadataDrafts';

interface PropertiesModalProps {
  stateMachines: Record<string, StateMachine>;
  stateMachinesId: string[];
  isOpen: boolean;
  onClose: () => void;
  selectedSm: string;
  setSelectedSm: React.Dispatch<React.SetStateAction<string>>;
}

type FileProperty = [name: string, value: string];

const numberFormat = new Intl.NumberFormat('ru-RU');

const unavailableFileProperties = (
  name: string | null,
  basename: string | null
): FileProperty[] => [
  ['Название', name ?? '—'],
  ['Путь к файлу', basename ?? '—'],
  ['Размер файла', '—'],
  ['Дата и время создания файла', '—'],
  ['Дата и время последнего изменения файла', '—'],
];

export const PropertiesModal: React.FC<PropertiesModalProps> = ({
  setSelectedSm,
  selectedSm,
  onClose,
  stateMachines,
  stateMachinesId,
  isOpen,
}) => {
  const model = useModelContext().model;
  const name = model.useData('', 'name') as string | null;
  const basename = model.useData('', 'basename') as string | null;
  const [fileProperties, setFileProperties] = useState<FileProperty[]>(() =>
    unavailableFileProperties(name, basename)
  );
  const [drafts, setDrafts] = useState<MetadataDrafts>({});
  const [draftErrors, setDraftErrors] = useState<MetadataDraftErrors>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const nextRowId = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    const nextDrafts = createMetadataDrafts(stateMachinesId, stateMachines);
    const nextSelectedSm = stateMachinesId.includes(selectedSm)
      ? selectedSm
      : stateMachinesId[0] ?? '';

    setDrafts(nextDrafts);
    setDraftErrors({});
    setFocusRowId(null);
    setSelectedSm(nextSelectedSm);
    nextRowId.current = Object.values(nextDrafts).reduce((count, rows) => count + rows.length, 0);
    // Drafts are intentionally recreated only when the modal is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setFileProperties(unavailableFileProperties(name, basename));

    if (!basename) return;

    window.api.fileHandlers
      .getMetadata(basename)
      .then((stat) => {
        if (cancelled) return;

        setFileProperties([
          ['Название', name ?? '—'],
          ['Путь к файлу', basename],
          ['Размер файла', `${numberFormat.format(stat.size)} байтов`],
          ['Дата и время создания файла', dateFormatTimeAndDate(stat.birthtime)],
          ['Дата и время последнего изменения файла', dateFormatTimeAndDate(stat.mtime)],
        ]);
      })
      .catch(() => {
        // The path may become unavailable between opening the document and this modal.
        if (!cancelled) setFileProperties(unavailableFileProperties(name, null));
      });

    return () => {
      cancelled = true;
    };
  }, [basename, isOpen, name]);

  const stateMachineOptions: ParameterSelectOption[] = useMemo(
    () =>
      stateMachinesId.map((stateMachineId) => ({
        value: stateMachineId,
        label: stateMachines[stateMachineId]?.name || stateMachineId,
      })),
    [stateMachines, stateMachinesId]
  );

  const updateDrafts = (nextDrafts: MetadataDrafts) => {
    setDrafts(nextDrafts);
    if (Object.keys(draftErrors).length > 0) {
      setDraftErrors(validateMetadataDrafts(nextDrafts));
    }
  };

  const handleAdd = () => {
    if (!selectedSm) return;

    const rowId = `draft:${nextRowId.current++}`;
    updateDrafts({
      ...drafts,
      [selectedSm]: [...(drafts[selectedSm] ?? []), { id: rowId, name: '', value: '' }],
    });
    setFocusRowId(rowId);
  };

  const handleChange = (rowId: string, field: 'name' | 'value', value: string) => {
    if (!selectedSm) return;

    updateDrafts({
      ...drafts,
      [selectedSm]: (drafts[selectedSm] ?? []).map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    });
  };

  const handleDelete = (rowId: string) => {
    if (!selectedSm) return;

    updateDrafts({
      ...drafts,
      [selectedSm]: (drafts[selectedSm] ?? []).filter((row) => row.id !== rowId),
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validateMetadataDrafts(drafts);
    const firstInvalidStateMachine = stateMachinesId.find(
      (stateMachineId) => nextErrors[stateMachineId]
    );

    if (firstInvalidStateMachine) {
      setDraftErrors(nextErrors);
      setSelectedSm(firstInvalidStateMachine);
      return;
    }

    stateMachinesId.forEach((stateMachineId) => {
      const nextMeta = metadataDraftToMeta(drafts[stateMachineId] ?? []);
      const currentMeta = stateMachines[stateMachineId]?.meta ?? {};
      if (!areMetadataEqual(currentMeta, nextMeta)) model.setMeta(stateMachineId, nextMeta);
    });

    onClose();
  };

  const selectedRows = selectedSm ? drafts[selectedSm] ?? [] : [];
  const selectedErrors = selectedSm ? draftErrors[selectedSm] ?? {} : {};

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={handleSubmit}
      title="Свойства"
      hideCancelButton
      submitDisabled={stateMachinesId.length === 0}
      submitClassName="btn-primary disabled:border-inactive-button disabled:bg-inactive-button disabled:text-text-disabled disabled:opacity-100"
    >
      <dl className="flex flex-col gap-2">
        {fileProperties.map(([propertyName, value]) => (
          <div key={propertyName}>
            <dt className="inline font-medium">{propertyName}: </dt>
            <dd className="inline break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <ParameterSelect
        containerClassName="mt-6 w-[216px]"
        options={stateMachineOptions}
        onChange={(option) => setSelectedSm(option?.value ?? '')}
        value={stateMachineOptions.find((option) => option.value === selectedSm) ?? null}
        menuWidth="content"
        isSearchable={false}
        noOptionsMessage={() => 'Нет машин состояний'}
      />

      <Meta
        rows={selectedRows}
        errors={selectedErrors}
        canAdd={!!selectedSm}
        focusRowId={focusRowId}
        onAdd={handleAdd}
        onChange={handleChange}
        onDelete={handleDelete}
        onFocusHandled={() => setFocusRowId(null)}
      />
    </Modal>
  );
};
