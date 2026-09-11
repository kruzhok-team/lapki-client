import { toast } from 'sonner';

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
      <div className="contents">
        <span>{label}:</span>
        <span className="min-w-0 break-words">{value}</span>
      </div>
    );
  };
  const meta = addressData.meta;
  return (
    <Modal
      title={`Метаданные: ${ManagerMS.displayAddressInfo(addressData)}`}
      isOpen={isOpen}
      onRequestClose={onClose}
      className="w-fit min-w-[360px]"
      onSubmit={(e) => handleSubmit(e)}
      submitDisabled={!meta}
      submitLabel="Скопировать"
      sideClassName="btn-secondary"
      sideLabel="Справка"
      onSide={() => openHelp()}
      hideCancelButton
    >
      {meta && (
        <div className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2">
          <h2 className="col-span-2 mb-1 font-medium">Bootloader:</h2>
          {renderField('REF_HW', meta.RefBlHw)}
          {renderField('REF_FW', meta.RefBlFw)}
          {renderField('REF_CHIP', meta.RefBlChip)}
          {renderField('REF_PROTOCOL', meta.RefBlProtocol)}
          {renderField('USER_CODE', meta.RefBlUserCode)}
          <h2 className="col-span-2 mb-1 font-medium">Cybergene:</h2>
          {renderField('REF_HW', meta.RefCgHw)}
          {renderField('REF_FW', meta.RefCgFw)}
          {renderField('REF_PROTOCOL', meta.RefCgProtocol)}
        </div>
      )}
      {!meta && <p className="mb-1 text-xl opacity-60">Метаданных нет</p>}
      <Modal
        isOpen={isHelpOpen}
        onRequestClose={onHelpClose}
        title={'Справка'}
        hideCancelButton
        submitClassName="hidden"
      >
        <div>
          <span className="font-medium">Метаданные</span> — это техническая информация, полученная с
          платы. С помощью метаданных определяется тип платы. Эти данные могут быть полезны для
          разработчиков, в случае, если с платой что-то не так.
        </div>

        <br />
        {/* TODO: описать как установить драйвера? */}
        <div>
          Метаданные автоматически считываются из платы при подключении из списка устройств. Их
          также можно получить, нажав кнопку «Запросить метаданные», при этом соответствующая плата
          должна быть подключена. Если данные не удаётся получить, возможно, следует обновить
          драйвера.
        </div>
      </Modal>
    </Modal>
  );
};
