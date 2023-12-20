import React from 'react';

import { Modal } from '@renderer/components/UI';

export type ErrorModalData = {
  text: JSX.Element;
  caption: string;
};

interface ErrorModalProps {
  isOpen: boolean;
  data: ErrorModalData | null | undefined;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ onClose, data, ...props }) => {
  return (
    <Modal {...props} onRequestClose={onClose} title={data?.caption ?? 'Сообщение'}>
      {data?.text ?? 'Все, что нас не убивает, делает нас сильнее. /Ф.В. Ницше./'}
    </Modal>
  );
};
