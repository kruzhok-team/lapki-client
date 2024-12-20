import React, { useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ReactComponent as StateMachineIcon } from '@renderer/assets/icons/cpu-bw.svg';
import { Modal, Select, SelectOption } from '@renderer/components/UI';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { Meta as MetaData, StateMachine } from '@renderer/types/diagram';

import { Meta, MetaFormValues } from './Meta';

const dateFormat = new Intl.DateTimeFormat('ru-Ru', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format;

interface PropertiesModalProps {
  controller: CanvasController;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertiesModal: React.FC<PropertiesModalProps> = ({ onClose, ...props }) => {
  const modelController = useModelContext();
  const model = modelController.model;
  const name = model.useData('', 'name');
  const basename = model.useData('', 'basename');
  // TODO(L140-beep): А вот здесь нужно селектор сделать и убрать CanvasController
  const stateMachines = modelController.model.useData('', 'elements.stateMachinesId') as {
    [id: string]: StateMachine;
  };
  const stateMachinesId = Object.keys(stateMachines).filter((value) => value !== '');
  const [selectedSm, setSelectedSm] = useState<string>(stateMachinesId[0]);
  const platform = model.useData(selectedSm, 'elements.platform');
  const meta = model.useData(selectedSm, 'elements.meta') as MetaData;
  const [baseProperties, setBaseProperties] = useState<[string, string][]>([]);
  const metaForm = useForm<MetaFormValues>();

  useMemo(async () => {
    const propertiesValues: [string, string][] = [
      ['Название', name ?? 'отсутствует'],
      ['Платформа', getPlatform(platform)?.name ?? 'отсутствует'],
    ];
    if (basename) {
      // (chekoopa): На будущее: кажется тонким местом, где может быть подвисание/вылет.
      const stat = await window.api.fileHandlers.getMetadata(basename);
      propertiesValues.push(['Путь к файлу', basename]);
      propertiesValues.push(['Дата и время последнего изменения файла', dateFormat(stat['mtime'])]);
      propertiesValues.push(['Дата и время создания файла', dateFormat(stat['birthtime'])]);
      propertiesValues.push(['Размер файла', stat['size'] + ' байтов']);
    }
    metaForm.setValue(
      'meta',
      Object.entries(meta).map(([name, value]) => ({ name, value })) as never // TODO(L140-beep): Почему линтер ругается?
    );
    metaForm.clearErrors();
    setBaseProperties(propertiesValues);
  }, [platform, basename, name, meta]);

  const smOptions: SelectOption[] = useMemo(() => {
    const getOption = (id: string) => {
      return {
        value: id,
        label: id,
        hint: undefined,
        icon: <StateMachineIcon className="size-8 fill-border-contrast px-1" />,
      };
    };

    return stateMachinesId.map((smId) => getOption(stateMachines[smId].name ?? smId));
  }, [stateMachines, stateMachinesId]);

  const handleMetaSubmit = metaForm.handleSubmit((data) => {
    model.setMeta(
      selectedSm,
      data.meta.reduce((acc, cur) => {
        acc[cur.name] = cur.value;

        return acc;
      }, {})
    );

    onClose();
  });

  const handleStateMachineChange = async (smId: string) => {
    if (!smId) return;

    const newSm = modelController.model.data.elements.stateMachines[smId];
    metaForm.setValue(
      'meta',
      Object.entries(newSm.meta).map(([name, value]) => ({ name, value })) as never // TODO(L140-beep): Почему линтер ругается?
    );
    metaForm.clearErrors();
    setSelectedSm(smId);
  };

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      // onAfterOpen={onAfterOpen}
      onSubmit={handleMetaSubmit}
      title="Свойства"
    >
      <h3 className="mb-1 text-xl">Свойства файла</h3>
      <Select
        containerClassName="w-[250px]"
        options={smOptions}
        onChange={(opt) => handleStateMachineChange(opt?.value ?? '')}
        value={smOptions.find((o) => o.value === selectedSm)}
        isSearchable={false}
        noOptionsMessage={() => 'Нет подходящих атрибутов'}
      />
      <div className="mb-2 flex flex-col gap-1">
        {[...baseProperties].map(([name, value]) => (
          <div key={name}>
            <b>{name}:</b> {value}
          </div>
        ))}
      </div>
      <Meta form={metaForm} />
    </Modal>
  );
};
