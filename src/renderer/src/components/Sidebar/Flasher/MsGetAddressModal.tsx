import React, { useState } from 'react';

import { Checkbox, Modal } from '../../UI';

interface MsGetAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onNoRemind: () => void;
}

export const MsGetAddressModal: React.FC<MsGetAddressModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onNoRemind,
  ...props
}) => {
  const [isChecked, setIschecked] = useState<boolean>(false);
  const handleClose = () => {
    if (isChecked) {
      onNoRemind();
    }
    onClose();
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
    handleClose();
  };
  return (
    <Modal
      {...props}
      isOpen={isOpen}
      onRequestClose={handleClose}
      title="Получение адреса"
      submitLabel="Получить адрес"
      onSubmit={handleSubmit}
      cancelLabel="Отменить"
    >
      <div>
        Возьмите плату, которую вы хотите опознать. В окошке «<b>Киберфизический ген</b>» зажмите
        кнопку <b>Addr</b> и, не отпуская её, нажмите кнопку <b>Reset</b>. Светодиод «<b>!</b>»
        должен загореться синим. После этого нажмите <b>Получить адрес</b>.
      </div>
      <div className="flex items-start">
        <Checkbox
          className="ml-1 mr-1 mt-[9px]"
          checked={isChecked}
          onCheckedChange={() => setIschecked(!isChecked)}
        />
        <label className="mt-[9px]">
          <em>Больше не напоминать</em>
        </label>
      </div>
    </Modal>
  );
};
