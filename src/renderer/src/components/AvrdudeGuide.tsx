/*
Модалка с ссылкой на инструкцию по установке avrdude
*/
import React from 'react';

import { Modal } from '@renderer/components/UI';

interface AvrdudeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ссылка на инструкцию по установке avrdude
const guideRef =
  'https://github.com/kruzhok-team/lapki-flasher/wiki/%D0%A3%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0-AVRDUDE';

export const AvrdudeGuideModal: React.FC<AvrdudeGuideModalProps> = ({ onClose, ...props }) => {
  return (
    <Modal {...props} onRequestClose={onClose} title="Отсутствует avrdude">
      <div>
        Загрузчик не может найти программу Avrdude на вашем устройстве. Она необходима для того,
        чтобы прошивать некоторые устройства (например, Arduino).
        <br></br>
        <br></br>
        Обратитесь к{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href={guideRef}
          target="_blank"
          rel="noopener noreferrer"
        >
          инструкции
        </a>
        , чтобы узнать, как правильно установить и настроить Avrdude.
        <br></br>
        <br></br>И не забудьте <b>перезапустить</b> IDE после установки и настройки Avrdude!
      </div>
    </Modal>
  );
};
