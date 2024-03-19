import React, { memo } from 'react';

import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { TextArea, TextInput } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';

interface MetaFieldProps {
  name: string;
  value: string;
}

export const MetaField: React.FC<MetaFieldProps> = memo((props) => {
  const { name, value } = props;

  const { manager } = useEditorContext();

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    manager.changeMetaFieldName(name, e.target.value);
  };

  const handleChangeValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    manager.changeMetaFieldValue(name, e.target.value);
  };

  const handleDelete = () => {
    manager.deleteMetaField(name);
  };

  console.log('MetaField render', { name, value });

  return (
    <div className="flex items-start gap-1">
      <TextInput value={name} onChange={handleChangeName} />
      <TextArea value={value} onChange={handleChangeValue} rows={1} />
      <button
        type="button"
        className="rounded p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
        onClick={handleDelete}
      >
        <CloseIcon className="h-3 w-3" />
      </button>
    </div>
  );
});
