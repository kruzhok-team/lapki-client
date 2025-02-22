import React from 'react';

import { Modal } from '@renderer/components/UI';
import {
  releaseName,
  appVersion,
  seriousMode,
  telegramLink,
  sourceLink,
  showDevInfo,
  appName,
} from '@renderer/version';

interface AboutTheProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutTheProgramModal: React.FC<AboutTheProgramModalProps> = ({
  onClose,
  ...props
}) => {
  const codeName = !seriousMode ? `«${releaseName}»` : '';
  const devInfo = (
    <>
      <b>Разработка:</b>{' '}
      <a
        className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
        href="https://polyus-nt.ru"
        target="_blank"
        rel="noopener noreferrer"
      >
        ООО «Полюс-НТ»
      </a>{' '}
      и{' '}
      <a
        className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
        href="https://github.com/kruzhok-team/lapki-client"
        target="_blank"
        rel="noopener noreferrer"
      >
        сообщество
      </a>
      <br />
    </>
  );

  return (
    <Modal {...props} onRequestClose={onClose} title={appName}>
      <div>
        <b>Версия:</b> {appVersion} {codeName}
        <br />
        <br />
        {showDevInfo ? devInfo : ''}
        <b>Исходные коды проекта:</b>{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href={sourceLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {sourceLink}
        </a>
        <br />
        <b>Обратная связь:</b>{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href="https://github.com/kruzhok-team/lapki-client/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          сообщить об ошибке,
        </a>{' '}
        <a
          className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-300 focus:text-blue-300 active:text-blue-700"
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          чат в Telegram
        </a>
        <br />
      </div>
    </Modal>
  );
};
