import { useForm } from 'react-hook-form';

import { Modal } from '@renderer/components/UI';
import { fullResetSetting } from '@renderer/hooks';

interface ResetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
/*
Окно, ожидающее подтвержение пользователя о том, что он хочет сбросить настройки
*/
export const ResetSettingsModal: React.FC<ResetSettingsModalProps> = ({ onClose, ...props }) => {
  const { handleSubmit: hookHandleSubmit } = useForm();
  const RESET_LABEL = 'Сбросить настройки';
  const handleSubmit = hookHandleSubmit(() => {
    fullResetSetting().then(() => {
      location.reload();
    });
  });

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Сброс настроек"
      submitLabel={RESET_LABEL}
      onSubmit={handleSubmit}
    >
      Вы уверены, что хотите <b>сбросить</b> настройки? Это действие <b>нельзя будет отменить</b>.
      После нажатия на кнопку "<b>{RESET_LABEL}</b>" IDE <b>перезапустится</b>, все значения
      настроек вернутся к <b>изначальным</b>, а <b>несохранённые изменения </b> в схеме будут{' '}
      <b> утеряны!</b>
    </Modal>
  );
};
