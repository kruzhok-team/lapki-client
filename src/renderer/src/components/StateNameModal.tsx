import React, { useLayoutEffect, useState } from 'react';

import { State } from '@renderer/lib/drawable/State';
import { Point } from '@renderer/types/graphics';

interface StateNameModalProps {
  isOpen: boolean;
  onClose: () => void;

  state: State;
  position: Point;
  sizes: State['computedTitleSizes'];
  onRename: (name: string) => void;
}

export interface StateNameModalFormValues {
  name: string;
}

export const StateNameModal: React.FC<StateNameModalProps> = (props) => {
  const { isOpen, onClose, state, position, sizes, onRename } = props;

  const [value, setValue] = useState<string>();

  const onSubmit = () => {
    onRename(value!);
  };

  useLayoutEffect(() => {
    setValue(state.data.name);
  }, [state]);

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
  console.log(state.data.name);
  return (
    <input
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
  );
};
