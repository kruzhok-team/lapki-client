import React from 'react';

import { Modal } from './Modal/Modal';

export type ErrorModalData = {
  text: JSX.Element;
  caption: string;
};

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
        Версия: electron v27.1.2
        <br />
        Дата релиза: 22 ноября 2023 года
        <br />
        Ссылка на проект:{' '}
        <a
          className="text-blue-600 transition duration-150 ease-in-out hover:text-blue-500 focus:text-blue-500 active:text-blue-700"
          href="https://github.com/kruzhok-team/lapki-client"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/kruzhok-team/lapki-client
        </a>
        <br />
      </div>
    </Modal>
  );
};
