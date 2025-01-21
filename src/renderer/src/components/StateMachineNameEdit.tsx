import React, {
  useEffect,
  useState,
  CSSProperties,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';

import { twMerge } from 'tailwind-merge';

import { WithHint } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { DrawableStateMachine } from '@renderer/lib/drawable/StateMachineNode';
import { useModelContext } from '@renderer/store/ModelContext';

interface StateMachineNameEditProps {
  controller: CanvasController;
}

export const StateMachineNameEdit: React.FC<StateMachineNameEditProps> = ({ controller }) => {
  const modelController = useModelContext();
  const [isOpen, open, close] = useModal(false);
  const [sMId, setStateId] = useState<string | null>(null);
  const [initialName, setInitialName] = useState<string | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.value ?? '').trim();

    if (sMId !== null && initialName !== value)
      modelController.editStateMachine(sMId, {
        ...modelController.model.data.elements.stateMachines[sMId],
        name: value,
      });

    setStateId(null);
    setInitialName(null);
    close();
  }, [sMId, close, initialName]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return handleSubmit();
    // Отмена редактирования
    if (e.key === 'Escape') {
      setStateId(null);
      setInitialName(null);
      return close();
    }
  };

  useLayoutEffect(() => {
    window.addEventListener('wheel', handleSubmit);
    return () => window.removeEventListener('wheel', handleSubmit);
  }, [handleSubmit]);

  useEffect(() => {
    const handler = (sm: DrawableStateMachine) => {
      const el = ref.current;
      if (!el) return;

      const globalOffset = controller.view.app.mouse.getOffset();
      const statePos = sm.computedPosition;
      const sizes = sm.computedTitleSizes;

      const position = {
        x: statePos.x + globalOffset.x,
        y:
          statePos.y +
          globalOffset.y +
          (sizes.height / controller.scale) * 2 -
          3 / controller.scale,
      };
      setStateId(sm.id);
      setInitialName(sm.icon.label ?? null);
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: sizes.width + 'px',
        height: sizes.height + 'px',
        fontSize: Math.max(sizes.fontSize, 15) + 'px',
        padding: `${0}px ${Math.max(sizes.paddingX, 15)}px`,
      });

      el.value = sm.icon.label ?? '';
      setTimeout(() => el.focus(), 0);
      open();
    };
    controller.stateMachines.on('changeStateMachineName', handler);

    return () => {
      controller.stateMachines.off('changeStateMachineName', handler);
    };
  }, [sMId, controller, open]);

  return (
    <WithHint
      hint="Нажмите ⏎, чтобы применить"
      offset={{ crossAxis: -20, mainAxis: 10 }}
      placement="top-end"
    >
      {(props) => (
        <input
          {...props}
          ref={ref}
          style={style}
          className={twMerge(
            'fixed rounded-t-[6px] bg-[#525252] text-white outline outline-2 outline-white',
            !isOpen && 'hidden'
          )}
          placeholder="Придумайте название"
          maxLength={50}
          onKeyUp={handleKeyUp}
          onBlur={handleSubmit}
          // Выставление каретки в конец
          onFocus={(e) =>
            e.currentTarget.setSelectionRange(
              e.currentTarget.value.length,
              e.currentTarget.value.length
            )
          }
        />
      )}
    </WithHint>
  );
};
