import { ManagerMS } from '@renderer/components/Modules/ManagerMS';
import { Modal } from '@renderer/components/UI';
import { AddressData } from '@renderer/types/FlasherTypes';

interface MetaDataModalProps {
  addressData: AddressData;
  isOpen: boolean;
  onClose: () => void;
}

export const MetaDataModal: React.FC<MetaDataModalProps> = ({ addressData, isOpen, onClose }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //TODO
    onClose();
  };
  const meta = addressData.meta;
  return (
    <Modal
      title={`Метаданные: ${ManagerMS.displayAddressInfo(addressData)}`}
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={(e) => handleSubmit(e)}
      submitLabel={'Скопировать метаданные'}
    >
      {meta && (
        <div className="mb-2 flex flex-col gap-1">
          <h3 className="mb-1 text-xl">Метаданные</h3>
          <div>
            <b>{'bootloader REF_HW'}:</b> {meta.RefBlHw}
          </div>
          <div>
            <b>{'bootloader REF_FW'}:</b> {meta.RefBlFw}
          </div>
          <div>
            <b>{'bootloader REF_CHIP'}:</b> {meta.RefBlChip}
          </div>
          <div>
            <b>{'bootloader REF_PROTOCOL'}:</b> {meta.RefBlProtocol}
          </div>
          <div>
            <b>{'bootloader USER_CODE'}:</b> {meta.RefBlUserCode}
          </div>
          <div>
            <b>{'cybergene REF_FW'}:</b> {meta.RefCgFw}
          </div>
          <div>
            <b>{'cybergene REF_HW'}:</b> {meta.RefCgHw}
          </div>
          <div>
            <b>{'cybergene REF_PROTOCOL'}:</b> {meta.RefCgProtocol}
          </div>
        </div>
      )}
      {!meta && <p className="mb-1 text-xl opacity-60">Метаданных нет</p>}
    </Modal>
  );
};
