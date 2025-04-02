import React, { useState } from 'react';

import { PlatformSelection } from './PlatformSelection';
import { StateMachinesStackItem } from './StateMachinesStack';
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
  const [selectedStateMachines, setSelectedStateMachines] = useState<StateMachinesStackItem[]>([]);

  const submitDisabled = tabValue === 0 ? !selectedPlatformIdx : !selectedTemplate;

  const submit = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submit();
  };

  const handleCLose = () => {
    onClose();
    setSelectedPlatformIdx(null);
  };

  const handleAddStateMachine = (stateMachine: StateMachinesStackItem) => {
    setSelectedStateMachines([...selectedStateMachines, stateMachine]);
  };

  const handleDeleteStateMachine = (index: number) => {
    setSelectedStateMachines(selectedStateMachines.toSpliced(index, 1));
  };

  return (
    <Modal
      {...props}
      onRequestClose={handleCLose}
      onSubmit={handleSubmit}
      submitDisabled={submitDisabled}
      title="Создание проекта"
      submitLabel="Создать"
    >
      <Tabs
        className="mb-4"
        tabs={['Платформы', 'Шаблоны']}
        value={tabValue}
        onChange={setTabValue}
      />

      <TabPanel value={0} tabValue={tabValue}>
        <PlatformSelection
          selectedStateMachines={selectedStateMachines}
          selectedPlatformIdx={selectedPlatformIdx}
          setSelectedPlatformIdx={setSelectedPlatformIdx}
          onDoubleClick={submit}
          onAddPlatform={handleAddStateMachine}
          onDeletePlatform={handleDeleteStateMachine}
        />
      </TabPanel>

      <TabPanel value={1} tabValue={tabValue}>
        <TemplateSelection
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          onDoubleClick={submit}
        />
      </TabPanel>
    </Modal>
  );
};
