import React, { useLayoutEffect, useState } from 'react';

import { WithHint } from '@renderer/components/UI';
import { useDiagramStateName } from '@renderer/hooks';

export interface StateNameModalFormValues {
  name: string;
}

export const StateNameModal: React.FC = () => {
  const { isOpen, onClose, state, position, sizes, onRename } = useDiagramStateName();

  const [value, setValue] = useState<string>('');

  const onSubmit = () => {
    onRename(value!);
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    setValue(state.data.name);
  }, [state]);

  useLayoutEffect(() => {
    window.addEventListener('wheel', onClose);
    return () => window.removeEventListener('wheel', onClose);
  });

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return onSubmit();
    if (e.key === 'Escape') return onClose();
  };

  if (!isOpen) return null;

  const inputStyle = {
    left: position.x + 'px',
    top: position.y + 'px',
    width: sizes.width + 'px',
    height: sizes.height + 'px',
    fontSize: Math.max(sizes.fontSize, 15) + 'px',
    padding: `${0}px ${Math.max(sizes.paddingX, 15)}px`,
  };

  return (
    <WithHint
      hint="Нажмите ⏎, чтобы применить"
      offset={{ crossAxis: -20, mainAxis: 10 }}
      placement="top-end"
    >
      {(props) => (
        <input
          {...props}
          style={inputStyle}
          autoFocus
          className="fixed rounded-t-[6px] bg-[#525252] text-white outline outline-2 outline-white"
          placeholder="Придумайте название"
          maxLength={20}
          onKeyUp={handleKeyUp}
          onBlur={onClose}
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      )}
    </WithHint>
  );
};
