import React from 'react';

import { ParameterSelect } from '@renderer/components/UI';
import { Action } from '@renderer/types/diagram';

import { ActionsModalParameters } from './ActionsModalParameters';

import { useActionsModal } from '../hooks/useActionModal';

export interface ActionsModalData {
  smId: string;
  action: Action;
  isEditingEvent: boolean;
  // If true, saving the action should persist it directly into the state (model)
  // If false/undefined, action edits are kept in the edit-event buffer until the event is saved
  persistOnSave?: boolean;
}

type ActionsModalProps = ReturnType<typeof useActionsModal>;

export const ActionsModal: React.FC<ActionsModalProps> = (props) => {
  const {
    componentOptions,
    selectedComponent,
    handleComponentChange,
    methodOptions,
    selectedMethod,
    handleMethodChange,
    protoParameters,
    parameters,
    setParameters,
    setErrors,
    errors,
    componentWithVariablesOptions,
    controller,
    smId,
    attributeOptionsSearch,
  } = props;
  return (
    <div className="flex h-full min-h-[290px] flex-col">
      <div className="mb-2 flex shrink-0 items-end gap-2">
        <p className="font-medium">Выберите действие</p>
      </div>
      <div className="mb-4 grid shrink-0 grid-cols-2 items-center gap-3">
        <ParameterSelect
          className="w-full"
          options={componentOptions}
          value={componentOptions.find((o) => o.value === selectedComponent) ?? null}
          onChange={handleComponentChange}
          placeholder="Выберите компонент..."
          isClearable={false}
          isSearchable={false}
          noOptionsMessage={() => <div>Отсутствуют подходящие компоненты</div>}
        />
        <ParameterSelect
          className="w-full"
          options={methodOptions}
          value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
          onChange={handleMethodChange}
          placeholder="Выберите действие..."
          isClearable={false}
          isSearchable={false}
          noOptionsMessage={() => (
            <div>
              У компонента отсутствуют действия <br /> Выберите другой компонент
            </div>
          )}
        />
      </div>
      <ActionsModalParameters
        protoParameters={protoParameters}
        parameters={parameters}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
        componentOptions={componentWithVariablesOptions}
        controller={controller}
        smId={smId}
        attributeOptionsSearch={attributeOptionsSearch}
      />
    </div>
  );
};
