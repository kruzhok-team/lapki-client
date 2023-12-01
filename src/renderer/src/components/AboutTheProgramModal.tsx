import React from 'react';

import { Modal } from './Modal/Modal';

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
        <b>Версия:</b> 0.1.0 «Abyssinian»
        <br />
        <b>Дата релиза:</b> 1 декабря 2023 года
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
