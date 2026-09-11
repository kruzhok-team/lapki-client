import { Meta, StateMachine } from '@renderer/types/diagram';

export interface MetadataDraftRow {
  id: string;
  name: string;
  value: string;
}

export interface MetadataFieldErrors {
  name?: string;
  value?: string;
}

export type MetadataDrafts = Record<string, MetadataDraftRow[]>;
export type MetadataDraftErrors = Record<string, Record<string, MetadataFieldErrors>>;

export const createMetadataDrafts = (
  stateMachineIds: string[],
  stateMachines: Record<string, StateMachine>
): MetadataDrafts =>
  Object.fromEntries(
    stateMachineIds.map((stateMachineId) => [
      stateMachineId,
      Object.entries(stateMachines[stateMachineId]?.meta ?? {}).map(([name, value], index) => ({
        id: `${stateMachineId}:${index}`,
        name,
        value,
      })),
    ])
  );

export const validateMetadataDrafts = (drafts: MetadataDrafts): MetadataDraftErrors => {
  const allErrors: MetadataDraftErrors = {};

  Object.entries(drafts).forEach(([stateMachineId, rows]) => {
    const names = new Map<string, string[]>();
    const errors: Record<string, MetadataFieldErrors> = {};

    rows.forEach((row) => {
      const normalizedName = row.name.trim();
      if (!normalizedName) {
        errors[row.id] = { ...errors[row.id], name: 'Обязательное поле' };
      } else {
        names.set(normalizedName, [...(names.get(normalizedName) ?? []), row.id]);
      }

      if (!row.value) {
        errors[row.id] = { ...errors[row.id], value: 'Обязательное поле' };
      }
    });

    names.forEach((rowIds) => {
      if (rowIds.length < 2) return;
      rowIds.forEach((rowId) => {
        errors[rowId] = { ...errors[rowId], name: 'Название уже используется' };
      });
    });

    if (Object.keys(errors).length > 0) allErrors[stateMachineId] = errors;
  });

  return allErrors;
};

export const metadataDraftToMeta = (rows: MetadataDraftRow[]): Meta =>
  rows.reduce<Meta>((meta, row) => {
    meta[row.name.trim()] = row.value;
    return meta;
  }, {});

export const areMetadataEqual = (left: Meta, right: Meta): boolean => {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([name, value], index) =>
        name === rightEntries[index]?.[0] && value === rightEntries[index]?.[1]
    )
  );
};
