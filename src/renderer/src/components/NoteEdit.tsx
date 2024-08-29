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

    if (noteId !== null && initialText !== value)
      editor.controller.notes.changeNoteText(noteId, value);

    if (noteId) editor.controller.notes.setIsVisible(noteId, true);

    setNoteId(null);
    setInitialText(null);
    close();
  }, [close, editor.controller.notes, initialText, noteId]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Отмена редактирования
    if (e.key === 'Escape') {
      if (noteId) editor.controller.notes.setIsVisible(noteId, true);

      setNoteId(null);
      setInitialText(null);
      return close();
    }
  };

  useEffect(() => {
    window.addEventListener('wheel', handleSubmit);
    return () => window.removeEventListener('wheel', handleSubmit);
  }, [handleSubmit]);

  useEffect(() => {
    const handler = (note: Note) => {
      const el = ref.current;
      if (!el) return;

      const globalOffset = editor.mouse.getOffset();
      const notePos = note.computedPosition;
      const position = {
        x: notePos.x + globalOffset.x,
        y: notePos.y + globalOffset.y,
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
      onBlur={handleSubmit}
    />
  );
};
