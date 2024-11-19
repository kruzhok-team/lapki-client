import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@renderer/components/UI';
import { StateMachineData } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';

interface StateMachineDeleteModalProps {
  data: StateMachineData | undefined;
  idx: string | undefined;
  isOpen: boolean;
  onClose: () => void;

  onSubmit: () => void;
}

export const StateMachineDeleteModal: React.FC<StateMachineDeleteModalProps> = ({
  data,
  idx,
  onClose,
  onSubmit,
  ...props
}) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;

  const handleAfterClose = () => {
    editor.focus();
  };

  const { handleSubmit: hookHandleSubmit } = useForm();
  const handleSubmit = hookHandleSubmit(() => {
    onSubmit();
    onClose();
  });
  // если одна их этих переменных undefined, то значит, что-то пошло не так
  if (data == undefined || idx == undefined) {
    return;
  }
  return (
    <Modal
      {...props}
      onAfterClose={handleAfterClose}
      onRequestClose={onClose}
      title="Удаление машины состояний"
      submitLabel="Удалить"
      onSubmit={handleSubmit}
    >
      <p>
        Вы действительно хотите удалить машину состояний
        <span className="px-1 font-bold">{`${data.name ?? idx} (${
          data.platform == '' ? 'неизвестная платформа' : data.platform
        })`}</span>
        ?
      </p>
      <br />
      <p className="italic">Внимание! Удаление машины состояний нельзя отменить!</p>
    </Modal>
  );
};
