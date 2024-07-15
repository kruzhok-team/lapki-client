import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { useEditorContext } from '@renderer/store/EditorContext';
import { TemplatesList } from '@renderer/types/templates';

interface TemplateSelectionProps {
  selectedTemplate: { type: string; name: string } | null;
  setSelectedTemplate: (value: { type: string; name: string }) => void;
}

export const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  selectedTemplate,
  setSelectedTemplate,
}) => {
  const { controller } = useEditorContext();

  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState({} as TemplatesList);

  const isSelected = (type: string, name: string) =>
    selectedTemplate?.type === type && selectedTemplate?.name === name;

  useEffect(() => {
    const fn = async () => {
      const data = await controller.model.files.getAllTemplates();

      setTemplates(data);
      setIsLoading(false);
    };

    fn();
  }, [controller.model.files]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return Object.entries(templates).map(([type, names]) => (
    <div key={type}>
      <h3 className="mb-1 text-lg capitalize">{type}</h3>
      <div className="flex flex-col">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            className={twMerge(
              'cursor-pointer select-none p-2 text-left capitalize transition-colors duration-75',
              isSelected(type, name) && 'bg-bg-active'
            )}
            onClick={() => setSelectedTemplate({ type, name })}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  ));
};
