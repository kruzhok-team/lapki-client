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
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';

export const StateNameEdit: React.FC = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const editor = modelController.controllers[headControllerId].app;
  const stateMachines = modelController.controllers[headControllerId];
  const currentSmId = stateMachines[0];
  const [isOpen, open, close] = useModal(false);
  const [stateId, setStateId] = useState<string | null>(null);
  const [initialName, setInitialName] = useState<string | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.value ?? '').trim();

    if (stateId !== null && initialName !== value)
      modelController.changeStateName(currentSmId, stateId, value);

    setStateId(null);
    setInitialName(null);
    close();
  }, [close, modelController.model, initialName, stateId]);

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
    const handler = (state: State) => {
      const el = ref.current;
      if (!el) return;

      const globalOffset = editor.view.app.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
      };
      const sizes = state.computedTitleSizes;

      setStateId(state.id);
      setInitialName(state.data.name);
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: sizes.width + 'px',
        height: sizes.height + 'px',
        fontSize: Math.max(sizes.fontSize, 15) + 'px',
        padding: `${0}px ${Math.max(sizes.paddingX, 15)}px`,
      });

      el.value = state.data.name;
      setTimeout(() => el.focus(), 0);
      open();
    };
    // TODO (L140-beep): работает ли?
    editor.controller.states.on('changeStateName', handler);

    return () => {
      editor.controller.states.off('changeStateName', handler);
    };
  }, [editor, open]);

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
