import React, { useEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';

interface FilePropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilePropertiesModal: React.FC<FilePropertiesModalProps> = ({ onClose, ...props }) => {
  return (
    <Modal {...props} onRequestClose={onClose} title="Свойства">
      <div>
        <b>Название:</b>
        <br />
        <b>Платформа: </b>
        <br />
        <b>Последняя дата изменения файла:</b>
        <br />
        <b>Путь к файлу :</b>
        <br />
      </div>
    </Modal>
  );
};
