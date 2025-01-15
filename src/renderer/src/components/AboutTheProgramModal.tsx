import React from 'react';

import { Modal } from '@renderer/components/UI';
import { releaseName, releaseDate, appVersion } from '@renderer/version';

interface AboutTheProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutTheProgramModal: React.FC<AboutTheProgramModalProps> = ({
  onClose,
  ...props
}) => {
  return (
    <Modal {...props} onRequestClose={onClose} title="О программе">
      <div>
        <b>Версия:</b> {appVersion} «{releaseName}»
        <br />
        <b>Дата релиза:</b> {releaseDate}
        <br />
        <b>Ссылка на проект:</b>{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href="https://github.com/kruzhok-team/lapki-client"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/kruzhok-team/lapki-client
        </a>
        <br />
        <b>Обратная связь:</b>{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href="https://github.com/kruzhok-team/lapki-client/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          баг-трекер,
        </a>{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href="https://t.me/LapkiSupportBot"
          target="_blank"
          rel="noopener noreferrer"
        >
          чат-бот в Telegram
        </a>
        <br />
      </div>
    </Modal>
  );
};
