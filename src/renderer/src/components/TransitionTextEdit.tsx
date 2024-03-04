import React, { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';

import { createTheme } from '@uiw/codemirror-themes';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { twMerge } from 'tailwind-merge';

import { useModal } from '@renderer/hooks/useModal';
import { State } from '@renderer/lib/drawable/State';
import { useEditorContext } from '@renderer/store/EditorContext';
import theme from '@renderer/theme';

const myTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#404040',
    foreground: '#FFF',
    caret: '#FFF',
    selection: '#0C4BEE',
    selectionMatch: '#0C4BEE',
    lineHighlight: '#8a91991a',
    gutterBackground: '#404040',
  },
  styles: [],
});

const text = `entry/
    LED1.on()
    timer1.start(1000)
    timer1.stop(1000)`;

export const StateTextEdit: React.FC = () => {
  const editor = useEditorContext();

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const [isOpen, open, close] = useModal(false);
  const [state, setState] = useState<State | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLSpanElement>(null);

  // const { setContainer, setState: setEditorState } = useCodeMirror({
  //   container: containerRef.current,
  //   // extensions,
  //   value: state ? text : '',
  //   theme: 'dark',
  //   height: '100%',
  //   onBlur: close,
  // });

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
      // const el = ref.current;
      // if (!el || !editor.textMode) return;
      if (!editor.textMode || !editorRef.current) return;

      editor.container.machineController.removeSelection();

      const globalOffset = editor.container.app.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y + state.computedTitleSizes.height,
      };
      const { width, height } = state.drawBounds;
      const fontSize = 16 / editor.manager.data.scale;
      const pX = 15 / editor.manager.data.scale;
      const pY = 10 / editor.manager.data.scale;
      const borderRadius = 6 / editor.manager.data.scale;
      // const { padding, fontSize, borderRadius } = note.computedStyles;

      // note.setVisible(false);

      setState(state);
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: width + 'px',
        height: height - state.computedTitleSizes.height + 'px',
        minHeight: fontSize + pY * 2 + 'px',
        fontSize: fontSize + 'px',
        padding: `${pY}px 0`,
        borderRadius: `0px 0px ${borderRadius}px ${borderRadius}px`,
        backgroundColor: theme.colors.diagram.state.bodyBg,
      });
      // el.textContent = text;
      // setTimeout(() => placeCaretAtEnd(el), 0); // А ты думал легко сфокусировать и установить картеку в конец?
      open();

      // console.log(editorRef.current.view);

      // const newPosition = (editorRef.current.view?.state.selection.ranges[0].from ?? 0) - 2;
      // console.log(newPosition);

      editorRef.current.view?.dispatch({
        selection: {
          anchor: 2,
          head: 2,
        },
      });

      // editorRef.current.view.

      // editorRef.current.view?.focus();
      // editorRef.current.editor?.focus();
    });
  }, [editor, open]);

  // useEffect(() => {
  //   if (containerRef.current) {
  //     setContainer(containerRef.current);
  //   }
  // }, [setContainer]);

  return (
    <CodeMirror
      ref={editorRef}
      theme={myTheme}
      style={style}
      // height="100px"
      className={twMerge('fixed overflow-hidden [&_.cm-content]:p-0', !isOpen && 'hidden')}
      value={state ? text : ''}
      onBlur={close}
      basicSetup={{
        lineNumbers: false,
      }}
    />
  );

  // return (
  //   <div
  //     style={style}
  //     className={twMerge('fixed overflow-hidden border-none', !isOpen && 'hidden')}
  //     ref={containerRef}
  //   ></div>
  // );

  // return (
  //   <TextAreaAutoResize
  //     ref={ref}
  //     tabIndex={-1}
  //     style={style}
  // className={twMerge(
  //   'fixed overflow-hidden whitespace-pre-wrap border-none text-base leading-none outline-none',
  //   !isOpen && 'hidden'
  // )}
  //     placeholder="Текст состояния"
  //     onBlur={handleClose}
  //   />
  // );
};
