/*
Модалка с ссылкой на инструкцию по установке avrdude
*/
import React from 'react';

import { Modal } from '@renderer/components/UI';

interface AvrdudeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvrdudeGuideModal: React.FC<AvrdudeGuideModalProps> = ({ onClose, ...props }) => {
  // ссылка на инструкцию по установке avrdude
  const guideRef =
    'https://github.com/kruzhok-team/lapki-flasher/wiki/%D0%A3%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0-AVRDUDE';

  return (
    <Modal {...props} onRequestClose={onClose} title="Отсутствует avrdude">
      <div>
        Загрузчик не может найти путь к avrdude на вашем устройстве. Эта программа ему необходима
        для того, чтобы он мог прошивать устройства. Прочитайте{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href={guideRef}
          target="_blank"
          rel="noopener noreferrer"
        >
          инструкцию
        </a>
        , чтобы узнать как установить и добавить avrdude.
      </div>
    </Modal>
  );
};
