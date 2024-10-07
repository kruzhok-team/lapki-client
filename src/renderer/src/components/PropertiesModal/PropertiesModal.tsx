import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@renderer/components/UI';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { Meta as MetaData } from '@renderer/types/diagram';

import { Meta, MetaFormValues } from './Meta';

const dateFormat = new Intl.DateTimeFormat('ru-Ru', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format;

interface PropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PropertiesModal: React.FC<PropertiesModalProps> = ({ onClose, ...props }) => {
  const modelController = useModelContext();
  const model = modelController.model;
  const name = model.useData('', 'name');
  const basename = model.useData('', 'basename');
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const currentSm = stateMachines[0];
  const platform = model.useData(currentSm, 'elements.platform');
  const meta: MetaData = model.useData(currentSm, 'elements.meta');
  const [properties, setProperties] = useState<[string, string][]>([]);

  const metaForm = useForm<MetaFormValues>();
  const onAfterOpen = async () => {
    metaForm.setValue(
      'meta',
      Object.entries(meta).map(([name, value]) => ({ name, value })) as never // Почему линтер ругается?
    );
    metaForm.clearErrors();

    const propertiesValues: [string, string][] = [
      ['Название', name ?? 'отсутствует'],
      ['Платформа', getPlatform(platform)?.name ?? 'отсутствует'],
    ];
    if (basename) {
      const stat = await window.api.fileHandlers.getMetadata(basename);
      propertiesValues.push(['Путь к файлу', basename]);
      propertiesValues.push(['Дата и время последнего изменения файла', dateFormat(stat['mtime'])]);
      propertiesValues.push(['Дата и время создания файла', dateFormat(stat['birthtime'])]);
      propertiesValues.push(['Размер файла', stat['size'] + ' байтов']);
    }
    setProperties(propertiesValues);
  };

  const handleMetaSubmit = metaForm.handleSubmit((data) => {
    model.setMeta(
      currentSm,
      data.meta.reduce((acc, cur) => {
        acc[cur.name] = cur.value;

        return acc;
      }, {})
    );

    onClose();
  });

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      onAfterOpen={onAfterOpen}
      onSubmit={handleMetaSubmit}
      title="Свойства"
    >
      <h3 className="mb-1 text-xl">Свойства файла</h3>
      <div className="mb-2 flex flex-col gap-1">
        {properties.map(([name, value]) => (
          <div key={name}>
            <b>{name}:</b> {value}
          </div>
        ))}
      </div>

      <Meta form={metaForm} />
    </Modal>
  );
};
