import { Modal } from '@renderer/components/UI';

interface AddressModalMSProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressModalMS: React.FC<AddressModalMSProps> = ({ onClose, ...props }) => {
  return (
    <Modal {...props} onRequestClose={onClose} title="Адрес">
      <div>Текст</div>
    </Modal>
  );
};
