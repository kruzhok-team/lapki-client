import React, { useState } from 'react';

import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { useSettings } from '@renderer/hooks';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';

import { Modal, ScrollArea } from './UI';

interface OpenRecentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (filePath: string) => void;
}

export const OpenRecentModal: React.FC<OpenRecentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ...props
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number | null>(null);
  const [recentFiles, setRecentFiles] = useSettings('recentFiles');

  if (recentFiles === null) return;

  const handleClose = () => {
    setSelectedFileIdx(null);
    onClose();
  };

  const submit = async (fileIdx = selectedFileIdx) => {
    if (fileIdx === null) return;

    const selectedFile = recentFiles[fileIdx];
    if (!selectedFile) return;

    const exists = await window.api.fileHandlers.existsFile(selectedFile.path);
    if (exists) {
      onSubmit(selectedFile.path);
      handleClose();
      return;
    }

    setRecentFiles(recentFiles.filter((file) => file.path !== selectedFile.path));
    setSelectedFileIdx(null);
    toast.error('Не удаётся найти выбранный файл');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const renderDescription = () => {
    if (selectedFileIdx === null) {
      return <p>Выберите документ из списка</p>;
    }

    const selectedFile = recentFiles[selectedFileIdx];
    if (!selectedFile) return null;

    return (
      <div className="max-h-[190px] overflow-y-auto break-words pr-1 leading-[15px]">
        <p>
          <span className="font-medium">Путь: </span>
        </p>
        <p>{selectedFile.path}</p>

        <div className="mt-3">
          <p>
            <span className="font-medium">Машины состояний</span>
          </p>
          {selectedFile.stateMachines.map((stateMachine, idx) => {
            if (stateMachine.name === '') return null;

            const platform = getPlatform(stateMachine.platformIdx);
            if (platform === undefined) return null;

            return (
              <div
                className={twMerge(idx > 0 && 'mt-2')}
                key={`${selectedFile.path}-${stateMachine.name}-${stateMachine.platformIdx}`}
              >
                <p>
                  <span className="font-medium">Название: </span> {stateMachine.name}
                </p>
                <p>
                  <span className="font-medium">Платформа: </span>
                  {platform.name ?? 'Неизвестная платформа'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFileList = () => (
    <div className="grid grid-cols-[274px_minmax(0,1fr)] gap-6">
      <ScrollArea
        className="h-[190px] rounded-lg border border-border-primary"
        viewportClassName="p-1.5"
      >
        {recentFiles.map((file, idx) => (
          <button
            type="button"
            key={file.path}
            className={twMerge(
              'block w-full select-none rounded-lg px-3 py-1 text-left leading-[17px] transition-colors duration-75 hover:bg-bg-hover',
              selectedFileIdx === idx && 'bg-bg-active hover:bg-bg-active'
            )}
            onClick={() => setSelectedFileIdx(idx)}
            onDoubleClick={() => void submit(idx)}
          >
            {file.name}
          </button>
        ))}
      </ScrollArea>

      <div>{renderDescription()}</div>
    </div>
  );

  return (
    <Modal
      {...props}
      hideCancelButton
      isOpen={isOpen}
      onRequestClose={handleClose}
      onSubmit={handleSubmit}
      submitDisabled={selectedFileIdx === null}
      title="Недавние документы"
      submitLabel="Открыть"
    >
      {recentFiles.length > 0 ? (
        renderFileList()
      ) : (
        <div className="grid h-[190px] place-items-center">
          <p>У вас пока нет недавних документов.</p>
        </div>
      )}
    </Modal>
  );
};
