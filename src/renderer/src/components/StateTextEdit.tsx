import React, { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';

import { twMerge } from 'tailwind-merge';

import { TextAreaAutoResize } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { State } from '@renderer/lib/drawable/State';
import { useEditorContext } from '@renderer/store/EditorContext';
import theme from '@renderer/theme';
import { placeCaretAtEnd } from '@renderer/utils';

export const StateTextEdit: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);
  const [state, setState] = useState<State | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLSpanElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.textContent ?? '').trim();

    if (!el || !state) return;

    // editor.container.machineController.changeNoteText(note.id, value);
  }, [editor, state]);

  const handleClose = useCallback(() => {
    handleSubmit();
    // note?.setVisible(true);

    close();
  }, [close, handleSubmit, state]);

  useEffect(() => {
    window.addEventListener('wheel', handleClose);
    return () => window.removeEventListener('wheel', handleClose);
  }, [handleClose]);

  useEffect(() => {
    editor.container.statesController.on('changeState', (state) => {
      const el = ref.current;
      if (!el || !editor.textMode) return;

      const globalOffset = editor.container.app.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y + state.computedTitleSizes.height,
      };
      const { width } = state.drawBounds;
      const fontSize = 16 / editor.manager.data.scale;
      const pX = 15 / editor.manager.data.scale;
      const pY = 10 / editor.manager.data.scale;
      const borderRadius = 6 / editor.manager.data.scale;
      const text = `entry/
    LED1.on()
    timer1.start(1000)
    timer1.stop(1000)`;
      // const { padding, fontSize, borderRadius } = note.computedStyles;

      // note.setVisible(false);

      setState(state);
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: width + 'px',
        minHeight: fontSize + pY * 2 + 'px',
        fontSize: fontSize + 'px',
        padding: `${pY}px ${pX}px`,
        borderRadius: `0px 0px ${borderRadius}px ${borderRadius}px`,
        backgroundColor: theme.colors.diagram.state.bodyBg,
      });
      el.textContent = text;
      setTimeout(() => placeCaretAtEnd(el), 0); // А ты думал легко сфокусировать и установить картеку в конец?
      open();
    });
  }, [editor, open]);

  return (
    <TextAreaAutoResize
      ref={ref}
      tabIndex={-1}
      style={style}
      className={twMerge(
        'fixed overflow-hidden whitespace-pre-wrap border-none text-base leading-none outline-none',
        !isOpen && 'hidden'
      )}
      placeholder="Текст состояния"
      onBlur={handleClose}
    />
  );
};
