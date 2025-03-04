import React, { useState } from 'react';

import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { useSettings } from '@renderer/hooks';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';

import { Modal } from './UI';

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

  const handleClick = (idx: number) => () => setSelectedFileIdx(idx);

  const isSelected = (idx: number) => selectedFileIdx === idx;

  const submit = async () => {
    if (selectedFileIdx === null) return;

    const path = recentFiles[selectedFileIdx].path;
    await window.api.fileHandlers.existsFile(path).then((exists) => {
      if (exists) {
        onSubmit(path);
        setSelectedFileIdx(null);
        onClose();
      } else {
        setRecentFiles(recentFiles.filter((file) => file.path !== path));
        toast.error('Не удаётся найти выбранный файл');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submit();
  };

  const description = () => {
    if (selectedFileIdx === null) {
      return <label>Выберите файл из списка слева</label>;
    }
    const selectedFile = recentFiles[selectedFileIdx];
    return (
      <div className="h-[40vh] flex-col items-center overflow-y-auto break-words">
        <div>
          <b>Путь</b>:
        </div>
        <div className="p-1">{selectedFile.path}</div>
        <div>
          <b>Машины состояний</b>:
        </div>
        {selectedFile.stateMachines.map((v) => {
          if (v.name === '') return;
          const platform = getPlatform(v.platformIdx);
          if (platform === undefined) return;
          return (
            <div className="p-1">
              <div>
                <b>Название:</b> {v.name}
              </div>
              <div>
                <b>Платформа:</b> {platform.name ?? 'Неизвестная платформа'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFileList = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[40vh] w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {recentFiles.map((file, idx) => (
            <div
              key={file.path}
              className={twMerge(
                'flex cursor-pointer select-none items-center gap-2 p-2 transition-colors duration-75',
                isSelected(idx) && 'bg-bg-active'
              )}
              onDoubleClick={submit}
              onClick={handleClick(idx)}
            >
              {file.name}
            </div>
          ))}
        </div>

        <div className={selectedFileIdx === null ? 'opacity-70' : ''}>{description()}</div>
      </div>
    );
  };

  const renderNoFileList = () => {
    return (
      <div>
        Не удалось найти последние файлы, которые были открыты в IDE. Они появятся в этом окне,
        после сохранения новой схемы, либо загрузки существующей.
      </div>
    );
  };

  return (
    <Modal
      {...props}
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={selectedFileIdx === null}
      title="Последние схемы"
      submitLabel="Открыть"
    >
      {recentFiles.length > 0 ? renderFileList() : renderNoFileList()}
    </Modal>
  );
};
