import React from 'react';

import { Modal } from './Modal/Modal';

export type ErrorModalData = {
  text: JSX.Element;
  caption: string;
};

interface ErrorModalProps {
  isOpen: boolean;
  data: ErrorModalData | null;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ onClose, data, ...props }) => {
  return (
    <Modal {...props} onRequestClose={onClose} title={data?.caption ?? 'Сообщение'}>
      {data?.text ?? 'Все, что нас не убивает, делает нас сильнее. /Ф.В. Ницше./'}
    </Modal>
  );
};
