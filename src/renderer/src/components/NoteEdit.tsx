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
  const [noteId, setNoteId] = useState<string | null>(null);
  const [initialText, setInitialText] = useState<string | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLSpanElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.textContent ?? '').trim();

    if (!el || noteId === null || initialText === value) return;

    editor.controller.notes.changeNoteText(noteId, value);

    setNoteId(null);
    setInitialText(null);
  }, [editor.controller.notes, initialText, noteId]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Отмена редактирования
    if (e.key === 'Escape') {
      setInitialText(null);
      return close();
    }
  };

  const handleClose = useCallback(() => {
    handleSubmit();

    if (noteId) editor.controller.notes.setIsVisible(noteId, true);

    close();
  }, [close, editor.controller.notes, handleSubmit, noteId]);

  useEffect(() => {
    window.addEventListener('wheel', handleClose);
    return () => window.removeEventListener('wheel', handleClose);
  }, [handleClose]);

  useEffect(() => {
    const handler = (note: Note) => {
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

      editor.controller.notes.setIsVisible(note.id, false);

      setNoteId(note.id);
      setInitialText(note.data.text);
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
    };

    editor.controller.notes.on('change', handler);

    return () => {
      editor.controller.notes.off('change', handler);
    };
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
      onKeyUp={handleKeyUp}
      onBlur={handleClose}
    />
  );
};
