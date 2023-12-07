import React, { useEffect, useMemo, useState } from 'react';

// import { twMerge } from 'tailwind-merge';

import { PlatformSelection } from './PlatformSelection';

import { Modal } from '../Modal/Modal';
import { TabPanel } from '../UI/Tabs/TabPanel';
import { Tabs } from '../UI/Tabs/Tabs';

interface Templates {
  [type: string]: { name: string; data: string }[];
}

interface CreateSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (idx: string) => void;
}

export const CreateSchemeModal: React.FC<CreateSchemeModalProps> = ({
  onClose,
  onCreate,
  ...props
}) => {
  const [tabValue, setTabValue] = useState(0);

  const [selectedPlatformIdx, setSelectedPlatformIdx] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState({} as Templates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // if (!selectedPlatformIdx) return;

    // onCreate(selectedPlatformIdx);
    handleCLose();
  };

  const handleCLose = () => {
    onClose();
    // setSelectedPlatformIdx(null);
  };

  useEffect(() => {
    const fn = async () => {
      const data = (await window.electron.ipcRenderer.invoke('getAllTemplates')) as Templates;

      setTemplates(data);
      setIsLoading(false);
    };

    fn();
  }, []);

  return (
    <Modal
      {...props}
      onRequestClose={handleCLose}
      onSubmit={handleSubmit}
      title="Выберите платформу"
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
        {isLoading ? 'Loading...' : Object.keys(templates).map((name) => <div>{name}</div>)}
      </TabPanel>
    </Modal>
  );
};
