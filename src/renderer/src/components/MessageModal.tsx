import React from 'react';

import { Modal } from './Modal/Modal';

interface MessageModalProps {
  isOpen: boolean;
  isData: MessageModalData | undefined;
  onClose: () => void;
}

export type MessageModalData = {
  text: JSX.Element;
  caption?: string;
};

export const MessageModal: React.FC<MessageModalProps> = ({ onClose, isData, ...props }) => {
  const onRequestClose = () => {
    onClose();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={isData?.caption ?? 'Сообщение'}
      submitLabel=""
      onSubmit={() => {}}
    >
      {isData?.text ?? 'Все, что нас не убивает, делает нас сильнее. /Ф.В. Ницше./'}
    </Modal>
  );
};
