import { toast } from 'sonner';

import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { ManagerMS } from '@renderer/components/Modules/ManagerMS';
import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks';
import { AddressData } from '@renderer/types/FlasherTypes';

interface MetaDataModalProps {
  addressData: AddressData;
  isOpen: boolean;
  onClose: () => void;
}

export const MetaDataModal: React.FC<MetaDataModalProps> = ({ addressData, isOpen, onClose }) => {
  const [isHelpOpen, openHelp, onHelpClose] = useModal(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = addressData.meta;
    if (!meta) return;
    const metaStr = `bootloader REF_HW: ${meta.RefBlHw}
bootloader REF_FW: ${meta.RefBlFw}
bootloader REF_CHIP: ${meta.RefBlChip}
bootloader REF_PROTOCOL: ${meta.RefBlProtocol}
bootloader USER_CODE: ${meta.RefBlUserCode}
cybergene REF_FW: ${meta.RefCgFw}
cybergene REF_HW: ${meta.RefCgHw}
cybergene REF_PROTOCOL: ${meta.RefCgProtocol}`;
    navigator.clipboard
      .writeText(metaStr)
      .then(() => toast.info('Метаданные скопированы в буфер обмена'));
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
      submitDisabled={!meta}
      submitLabel={'Скопировать метаданные'}
      sideClassName="rounded px-4 py-2 text-icon-active transition-colors hover:opacity-50"
      sideLabel="О метаданных..."
      onSide={() => openHelp()}
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
      <Modal isOpen={isHelpOpen} onRequestClose={onHelpClose} title={'Справка'}>
        <div>
          Метаданные — это информация, полученная с платы. С помощью неё определяется тип платы. Эти
          данные могут быть полезны для разработчиков, в случае, если с платой что-то не так.
        </div>

        <br />
        {/* TODO: описать как установить драйвера? */}
        <div>
          Метаданные должны автоматически извлечься из платы при подключении из списка устройств. Их
          также можно получить нажав кнопку «Получить метаданные», соответствующая плата должна быть
          подключена. Если данные не удаётся получить, то возможно Вам стоит обновить драйвера.
        </div>
      </Modal>
    </Modal>
  );
};
