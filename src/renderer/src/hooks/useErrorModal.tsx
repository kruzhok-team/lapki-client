import { useState } from 'react';

import { ErrorModalData } from '@renderer/components';

export const useErrorModal = () => {
  const [data, setData] = useState<ErrorModalData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openMsgModal = (data: ErrorModalData) => {
    setData(data);
    setIsOpen(true);
  };

  const onClose = () => setIsOpen(false);

  const openSaveError = (cause) => {
    openMsgModal({
      caption: 'Ошибка',
      text: (
        <div>
          <p> Не удалось записать схему в </p>
          <code className="break-all">{cause.name}</code>
          <br /> <br />
          <p> {cause.content} </p>
        </div>
      ),
    });
  };

  const openLoadError = (cause) => {
    openMsgModal({
      caption: 'Ошибка',
      text: (
        <div>
          <p> Не удалось прочесть схему из </p>
          <code className="break-all">{cause.name}</code>
          <br /> <br />
          <p> {cause.content} </p>
        </div>
      ),
    });
  };

  const openPlatformError = (errs: { [k: string]: string }) => {
    openMsgModal({
      caption: 'Внимание',
      text: (
        <div>
          <p> Есть проблемы с загруженными платформами. </p>
          <br />
          <ul>
            {Object.entries(errs).map(([platform, err]) => {
              return (
                <li key={platform}>
                  <b>{platform}</b>: {err}
                </li>
              );
            })}
          </ul>
        </div>
      ),
    });
  };

  const openImportError = (error: string) => {
    openMsgModal({
      caption: 'Ошибка импорта',
      text: (
        <div>
          <p>{error}</p>
        </div>
      ),
    });
  };

  return {
    errorModalProps: { isOpen, onClose, data },
    openSaveError,
    openLoadError,
    openPlatformError,
    openImportError,
  };
};
