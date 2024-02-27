import React, { useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Platform } from '@renderer/types/platform';
interface FilePropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilePropertiesModal: React.FC<FilePropertiesModalProps> = ({ onClose, ...props }) => {
  const { manager } = useEditorContext();

  const [fileSize, setFileSize] = useState<number>(0);
  const [fileLastModified, setFileLastModified] = useState<Date>();
  const [fileBirthDate, setFileBirthDate] = useState<Date>();
  const [platform, setPlatform] = useState<Platform | undefined>(undefined);
  // получение метаданных о файле
  const onAfterOpen = () => {
    window.electron.ipcRenderer.invoke('File:getMetadata', manager.data?.basename).then((stat) => {
      setFileBirthDate(stat['birthtime']);
      setFileLastModified(stat['mtime']);
      setFileSize(stat['size']);
    });

    setPlatform(getPlatform(manager.data.elements.platform));
    //setPlatform(getPlatform(manager.data.elements.platform));
  };
  // получить строку, предназначенную для чтения пользователем
  function dateFormat(date: Date | undefined): string {
    if (!date) {
      return '';
    }
    return `${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}`;
  }
  return (
    <Modal {...props} onRequestClose={onClose} onAfterOpen={onAfterOpen} title="Свойства">
      <div>
        <b>Название:</b> {manager.data.name}
        <br />
        <b>Платформа:</b> {platform?.name}
        <br />
        <b>Путь к файлу:</b> {manager.data.basename}
        <br />
        <b>Дата и время последнего изменения файла:</b> {dateFormat(fileLastModified)}
        <br />
        <b>Дата и время создания файла:</b> {dateFormat(fileBirthDate)}
        <br />
        <b>Размер файла:</b> {`${fileSize} байтов`}
        <br />
      </div>
    </Modal>
  );
};
