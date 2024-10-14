import React from 'react';

import { Modal } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';

interface TextModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}
/**
  Окно, ожидающее подтверждение пользователя о том, что он хочет перейти в текстовый режим
*/
export const TextModeModal: React.FC<TextModeModalProps> = ({ onClose, ...props }) => {
  const { controller } = useEditorContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    controller.setTextMode();

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
