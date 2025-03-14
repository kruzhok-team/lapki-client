import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
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
  const renderField = (label: string, value: string) => {
    return (
      <ComponentFormFieldLabel
        label={`${label}:`}
        value={value}
        disabled={true}
        className="rounded-none border-b border-l-0 border-r-0 border-t-0 pb-1"
      />
    );
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
        <div className="flex flex-col gap-2">
          <label>
            <b>Bootloader:</b>
          </label>
          <div className="ml-2 flex flex-col gap-2">
            {renderField('REF_HW', meta.RefBlHw)}
            {renderField('REF_FW', meta.RefBlFw)}
            {renderField('REF_CHIP', meta.RefBlChip)}
            {renderField('REF_PROTOCOL', meta.RefBlProtocol)}
            {renderField('USER_CODE', meta.RefBlUserCode)}
          </div>
          <label>
            <b>Cybergene:</b>
          </label>
          <div className="ml-2 flex flex-col gap-2">
            {renderField('REF_HW', meta.RefCgHw)}
            {renderField('REF_FW', meta.RefCgFw)}
            {renderField('REF_PROTOCOL', meta.RefCgProtocol)}
          </div>
        </div>
      )}
      {!meta && <p className="mb-1 text-xl opacity-60">Метаданных нет</p>}
    </Modal>
  );
};
