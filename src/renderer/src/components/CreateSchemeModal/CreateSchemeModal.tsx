import React, { useState } from 'react';

import { PlatformSelection } from './PlatformSelection';
import { TemplateSelection } from './TemplateSelection';

import { Modal } from '../UI/Modal/Modal';
import { TabPanel } from '../UI/Tabs/TabPanel';
import { Tabs } from '../UI/Tabs/Tabs';

interface CreateSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (idx: string) => void;
  onCreateFromTemplate: (type: string, name: string) => void;
}

export const CreateSchemeModal: React.FC<CreateSchemeModalProps> = ({
  onClose,
  onCreate,
  onCreateFromTemplate,
  ...props
}) => {
  const [tabValue, setTabValue] = useState(0);

  const [selectedPlatformIdx, setSelectedPlatformIdx] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{ type: string; name: string } | null>(
    null
  );

  const submitDisabled = tabValue === 0 ? !selectedPlatformIdx : !selectedTemplate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tabValue === 0) {
      if (!selectedPlatformIdx) return;

      onCreate(selectedPlatformIdx);
    } else if (tabValue === 1) {
      if (!selectedTemplate) return;

      const { type, name } = selectedTemplate;
      onCreateFromTemplate(type, name);
    }

    handleCLose();
  };

  const handleCLose = () => {
    onClose();
    setSelectedPlatformIdx(null);
  };

  return (
    <Modal
      {...props}
      onRequestClose={handleCLose}
      onSubmit={handleSubmit}
      submitDisabled={submitDisabled}
      title="Создание схемы"
      submitLabel="Создать"
    >
      <Tabs
        className="mb-4"
        tabs={['Создать пустую', 'Выбрать шаблон']}
        value={tabValue}
        onChange={setTabValue}
      />

      <TabPanel value={0} tabValue={tabValue}>
        <PlatformSelection
          selectedPlatformIdx={selectedPlatformIdx}
          setSelectedPlatformIdx={setSelectedPlatformIdx}
        />
      </TabPanel>

      <TabPanel value={1} tabValue={tabValue}>
        <TemplateSelection
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
      </TabPanel>
    </Modal>
  );
};
