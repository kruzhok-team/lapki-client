import React, { useEffect, useState } from 'react';

import { flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import { twMerge } from 'tailwind-merge';

import { useModal } from '@renderer/hooks';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { getVirtualElement } from '@renderer/utils';

interface Tooltip {
  controller: CanvasController;
}

export const Tooltip: React.FC<Tooltip> = ({ controller }) => {
  const [isOpen, open, close] = useModal(false);
  const { refs, floatingStyles } = useFloating({
    placement: 'right',
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });
  const [text, setText] = useState<string>('');
  const modelController = useModelContext();

  useEffect(() => {
    const handleShowTooltip = (args: { position: Point; text: string | undefined }) => {
      if (!args.text) return;
      refs.setReference(getVirtualElement({ ...args.position, x: args.position.x + 15 }));
      setText(args.text);
      open();
    };
    const handleCloseTooltip = () => {
      close();
    };
    modelController.on('changedHeadController', handleCloseTooltip);
    controller.view.on('showToolTip', handleShowTooltip);
    controller.view.on('closeToolTip', handleCloseTooltip);
    return () => {
      modelController.off('changedHeadController', handleCloseTooltip);
      controller.view.off('showToolTip', handleShowTooltip);
      controller.view.off('closeToolTip', handleCloseTooltip);
    };
  }, [controller, open, close, refs]);

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={twMerge(
        'z-50 rounded-md bg-bg-hover p-3 font-sans opacity-90 shadow-xl',
        !isOpen && 'hidden'
      )}
    >
      {text}
    </div>
  );
};
