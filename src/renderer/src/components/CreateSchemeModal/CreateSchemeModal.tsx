import React, { useState } from 'react';

import { EditorManager } from '@renderer/lib/data/EditorManager';

import { PlatformSelection } from './PlatformSelection';
import { TemplateSelection } from './TemplateSelection';

import { Modal } from '../Modal/Modal';
import { TabPanel } from '../UI/Tabs/TabPanel';
import { Tabs } from '../UI/Tabs/Tabs';

interface CreateSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (idx: string) => void;
  onCreateFromTemplate: (type: string, name: string) => void;
  manager: EditorManager;
}

export const CreateSchemeModal: React.FC<CreateSchemeModalProps> = ({
  onClose,
  onCreate,
  onCreateFromTemplate,
  manager,
  ...props
}) => {
  const [tabValue, setTabValue] = useState(0);

  const [selectedPlatformIdx, setSelectedPlatformIdx] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{ type: string; name: string } | null>(
    null
  );

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
    <Modal {...props} onRequestClose={handleCLose} onSubmit={handleSubmit} title="Создание схемы">
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
          manager={manager}
        />
      </TabPanel>
    </Modal>
  );
};
