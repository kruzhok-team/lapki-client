import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { useSettings } from '@renderer/hooks';

import { Modal } from './UI';

interface OpenRecentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (filePath: string) => void;
}

export const OpenRecentModal: React.FC<OpenRecentModalProps> = ({ onClose, onOpen, ...props }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number | null>(null);

  const [recentFiles, setRecentFiles] = useSettings('recentFiles');

  if (recentFiles === null) return;

  const handleClick = (idx: number) => () => setSelectedFileIdx(idx);

  const isSelected = (idx: number) => selectedFileIdx === idx;

  const submit = () => {
    if (selectedFileIdx === null) return;

    onOpen(recentFiles[selectedFileIdx].path);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submit();
  };

  const description = () => {
    if (selectedFileIdx === null) {
      return 'Выберите файл из списка слева';
    }
    return recentFiles[selectedFileIdx].path;
  };

  const renderFileList = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="max-h-[40vh] w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
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
              {file.basename}
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
