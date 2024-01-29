import React, { useEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';

interface UpdateData {
  name: string;
  url: string;
}

export const UpdateModal: React.FC = () => {
  const [isOpen, open, close] = useModal(false);
  const [data, setData] = useState<UpdateData>({ name: '', url: '' });

  const handleSubmit = () => {
    window.open(data.url, '_blank', 'noopener noreferrer');
    close();
  };

  useEffect(() => {
    const fn = async () => {
      const res = await window.electron.ipcRenderer.invoke('checkForUpdates');

      if (!res) return;

      setData(res);
      open();
    };

    fn();
  }, [open]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={close}
      onSubmit={handleSubmit}
      submitLabel="Перейти"
      title="Обновление"
    >
      Доступна новая версия <b>{data.name}</b>.
    </Modal>
  );
};
