import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@renderer/components/UI';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { useEditorContext } from '@renderer/store/EditorContext';

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
  const { controller } = useEditorContext();
  const model = controller.model;
  const meta = model.useData('elements.meta');

  const [properties, setProperties] = useState<[string, string][]>([]);

  const metaForm = useForm<MetaFormValues>();

  const onAfterOpen = async () => {
    metaForm.setValue(
      'meta',
      Object.entries(meta).map(([name, value]) => ({ name, value }))
    );
    metaForm.clearErrors();

    const propertiesValues: [string, string][] = [
      ['Название', model.data.name ?? 'отсутствует'],
      ['Платформа', getPlatform(model.data.elements.platform)?.name ?? 'отсутствует'],
    ];
    if (model.data?.basename) {
      const stat = await window.api.fileHandlers.getMetadata(model.data.basename);
      propertiesValues.push(['Путь к файлу', model.data.basename]);
      propertiesValues.push(['Дата и время последнего изменения файла', dateFormat(stat['mtime'])]);
      propertiesValues.push(['Дата и время создания файла', dateFormat(stat['birthtime'])]);
      propertiesValues.push(['Размер файла', stat['size'] + ' байтов']);
    }
    setProperties(propertiesValues);
  };

  const handleMetaSubmit = metaForm.handleSubmit((data) => {
    controller.model.setMeta(
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
