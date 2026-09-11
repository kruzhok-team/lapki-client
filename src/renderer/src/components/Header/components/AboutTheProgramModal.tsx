import React from 'react';

import { appVersion, telegramLink, sourceLink, showDevInfo } from '@renderer/version';

import { MovingModal } from '../../UI';

interface AboutTheProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutTheProgramModal: React.FC<AboutTheProgramModalProps> = ({
  onClose,
  ...props
}) => {
  const linkClassname = 'text-primary';
  const devInfo = (
    <>
      <span className="h2-header">Разработка:</span>{' '}
      <a
        className={linkClassname}
        href="https://polyus-nt.ru"
        target="_blank"
        rel="noopener noreferrer"
      >
        ООО «Полюс-НТ»
      </a>{' '}
      и{' '}
      <a
        className={linkClassname}
        href="https://github.com/kruzhok-team/lapki-client"
        target="_blank"
        rel="noopener noreferrer"
      >
        сообщество
      </a>
    </>
  );

  return (
    <MovingModal
      {...props}
      id="about-the-program"
      onRequestClose={onClose}
      title="О программе"
      className="w-[454px]"
      hideCancelButton
    >
      <div className="text-xs leading-[15px]">
        <div className="mb-3">
          <div className="h2-header">Cyberiada IDE</div>
          <div>
            <span className="h2-header">Версия: </span>
            {appVersion}
          </div>
        </div>

        {showDevInfo && <div>{devInfo}</div>}
        <div>
          <span className="h2-header">Исходные коды проекта:</span>{' '}
          <a className={linkClassname} href={sourceLink} target="_blank" rel="noopener noreferrer">
            {sourceLink}
          </a>
        </div>
        <div>
          <span className="h2-header">Обратная связь:</span>{' '}
          <a
            className={linkClassname}
            href="https://github.com/kruzhok-team/lapki-client/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            сообщить об ошибке,
          </a>{' '}
          <a
            className={linkClassname}
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            чат в Telegram
          </a>
        </div>
      </div>
    </MovingModal>
  );
};
