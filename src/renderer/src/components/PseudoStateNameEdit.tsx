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
import { ChoiceState, FinalState } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';

interface PseudoStateNameEditProps {
  smId: string;
  controller: CanvasController;
}

export const PseudoStateNameEdit: React.FC<PseudoStateNameEditProps> = ({ smId, controller }) => {
  const modelController = useModelContext();
  const [isOpen, open, close] = useModal(false);
  const [stateId, setStateId] = useState<string | null>(null);
  const [initialName, setInitialName] = useState<string | null>(null);
  const [state, setState] = useState<FinalState | ChoiceState | undefined>(undefined);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.value ?? '').trim();

    if (state !== undefined && stateId !== null && initialName !== value)
      modelController.changePseudoStateName(
        state instanceof ChoiceState ? 'choiceStates' : 'finalStates',
        smId,
        stateId,
        value
      );

    setStateId(null);
    setInitialName(null);
    close();
  }, [smId, close, initialName, stateId]);

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
    const handler = (state: FinalState | ChoiceState) => {
      const el = ref.current;
      if (!el) return;

      const globalOffset = controller.view.app.mouse.getOffset();
      const labelPos = state.label.computedPosition;
      const position = {
        x: labelPos.x + globalOffset.x,
        y: labelPos.y + globalOffset.y,
      };
      const sizes = state.label.computedDimensions;
      const { fontSize, textP, lineHeight } = state.label.style;
      setStateId(state.id);
      setState(state);
      setInitialName(state.label.text);
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: sizes.width + 'px',
        height: sizes.height + 'px',
        lineHeight: lineHeight,
        fontSize: fontSize / controller.scale + 'px',
        padding: `${0}px ${textP / controller.scale}px`,
      });

      el.value = state.label.text;
      setTimeout(() => el.focus(), 0);
      open();
    };
    controller.states.on('changePseudoStateName', handler);

    return () => {
      controller.states.off('changePseudoStateName', handler);
    };
  }, [smId, controller, open]);

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
            'fixed rounded-[10px] bg-bg-hover text-white outline outline-2 outline-white',
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
