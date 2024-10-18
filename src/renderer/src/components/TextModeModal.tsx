import React from 'react';

import { Modal } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

interface TextModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}
/**
  Окно, ожидающее подтверждение пользователя о том, что он хочет перейти в текстовый режим
*/
export const TextModeModal: React.FC<TextModeModalProps> = ({ onClose, ...props }) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    modelController.setTextMode(modelController.controllers[headControllerId]);

    onClose();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Переход в текстовый режим"
      submitLabel="Перейти"
      onSubmit={handleSubmit}
    >
      Вы уверены, что хотите перейти в текстовый режим? Это действие <b>нельзя будет отменить</b>.
      После нажатия на кнопку "Перейти" данную схему нельзя будет сделать визуальной.
    </Modal>
  );
};
