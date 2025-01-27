import React from 'react';

import { Modal } from './UI';

interface MsGetAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const MsGetAddressModal: React.FC<MsGetAddressModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
    onClose();
  };
  return (
    <Modal
      {...props}
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Получение адреса"
      submitLabel="Получить адрес"
      onSubmit={handleSubmit}
    >
      Возьмите плату, которую вы хотите опознать. Зажмите на ней кнопку <b>Addr</b> и, не отпуская
      её, нажмите кнопку <b>Reset</b>. Светодиод «<b>!</b>» должен загореться синим. После этого
      нажмите <b>Получить адрес</b>.
    </Modal>
  );
};
