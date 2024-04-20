import React, { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';

import { twMerge } from 'tailwind-merge';

import { TextAreaAutoResize } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { Note } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import { placeCaretAtEnd } from '@renderer/utils';

export const NoteEdit: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);
  const [note, setNote] = useState<Note | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLSpanElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.textContent ?? '').trim();

    if (!el || !note) return;

    editor.controller.notes.changeNoteText(note.id, value);
  }, [editor, note]);

  const handleClose = useCallback(() => {
    handleSubmit();
    note?.setVisible(true);

    close();
  }, [close, handleSubmit, note]);

  useEffect(() => {
    window.addEventListener('wheel', handleClose);
    return () => window.removeEventListener('wheel', handleClose);
  }, [handleClose]);

  useEffect(() => {
    editor.controller.notes.on('change', (note) => {
      const el = ref.current;
      if (!el) return;

      const globalOffset = editor.view.app.mouse.getOffset();
      const statePos = note.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
      };
      const { width } = note.drawBounds;
      const { padding, fontSize, borderRadius } = note.computedStyles;

      note.setVisible(false);

      setNote(note);
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: width + 'px',
        minHeight: fontSize + padding * 2 + 'px',
        fontSize: fontSize + 'px',
        padding: padding + 'px',
        borderRadius: borderRadius + 'px',
      });
      el.textContent = note.data.text;
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
        'fixed overflow-hidden whitespace-pre-wrap border-none bg-bg-secondary text-base leading-none outline outline-1 outline-text-primary',
        !isOpen && 'hidden'
      )}
      placeholder="Придумайте заметку"
      onBlur={handleClose}
    />
  );
};
