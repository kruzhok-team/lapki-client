import React, { useEffect, useState } from 'react';

import { Modal } from './Modal/Modal';

interface AboutTheProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutTheProgramModal: React.FC<AboutTheProgramModalProps> = ({
  onClose,
  ...props
}) => {
  const [appVersion, setAppVersion] = useState<string>('0.0.0');
  const releaseName = 'Abyssinian';
  const releaseDate = '1 декабря 2023 года';

  useEffect(() => {
    window.electron.ipcRenderer.invoke('appVersion').then((version) => {
      setAppVersion(version);
    });
  }, []);

  return (
    <Modal {...props} onRequestClose={onClose} title="О программе">
      <div>
        <b>Версия:</b> {appVersion} «{releaseName}»
        <br />
        <b>Дата релиза:</b> {releaseDate}
        <br />
        <b>Ссылка на проект:</b>{' '}
        <a
          className="text-blue-600 transition duration-150 ease-in-out hover:text-blue-500 focus:text-blue-500 active:text-blue-700"
          href="https://github.com/kruzhok-team/lapki-client"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/kruzhok-team/lapki-client
        </a>
        <br />
        <b>Обратная связь:</b>{' '}
        <a
          className="text-blue-600 transition duration-150 ease-in-out hover:text-blue-500 focus:text-blue-500 active:text-blue-700"
          href="https://github.com/kruzhok-team/lapki-client/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          баг-трекер
        </a>
        <br />
      </div>
    </Modal>
  );
};
