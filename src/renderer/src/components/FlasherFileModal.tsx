// модальное окно для выбора источника файла прошивки (либо из компилятора, либо из другого источника)
import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';
import { CompilerResult } from '@renderer/types/CompilerTypes';

interface FlasherFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCompiler: () => void;
  handleFileSystem: () => void;
  compilerData: CompilerResult | undefined;
}

export interface FlasherFileModalFormValues {
  idx: string;
}

export const FlasherFileModal: React.FC<FlasherFileModalProps> = ({
  onClose,
  handleCompiler,
  handleFileSystem,
  compilerData,
  ...props
}) => {
  const { reset, handleSubmit: hookHandleSubmit } = useForm<FlasherFileModalFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    onRequestClose();
  });

  const justSubmit = (idx: string) => {
    onRequestClose();
  };

  const onRequestClose = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Выберите откуда вы хотите загрузить прошивку'}
      submitLabel="Создать"
      onSubmit={undefined /* TODO: handleSubmit */}
    >
      <button
        type="button"
        className="btn rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => handleCompiler()}
        disabled={compilerData?.binary === undefined || compilerData.binary.length == 0}
      >
        Компилятор
      </button>
      <br /> <br />
      <button
        type="button"
        className="btn rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => handleFileSystem()}
      >
        Файловая система
      </button>
    </Modal>
  );
};
