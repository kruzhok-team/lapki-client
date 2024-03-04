import React, { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';

import { createTheme } from '@uiw/codemirror-themes';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { twMerge } from 'tailwind-merge';

import { useModal } from '@renderer/hooks/useModal';
import { Node } from '@renderer/lib/drawable/Node';
import { useEditorContext } from '@renderer/store/EditorContext';

const stateTheme = createTheme({
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

const transitionTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'rgb(23, 23, 23)',
    foreground: '#FFF',
    caret: '#FFF',
    selection: '#0C4BEE',
    selectionMatch: '#0C4BEE',
    lineHighlight: '#8a91991a',
    gutterBackground: 'rgb(23, 23, 23)',
  },
  styles: [],
});

const themes = {
  state: stateTheme,
  transition: transitionTheme,
};

interface NodeData {
  node: Node;
  type: 'state' | 'transition';
  initialValue: string;
}

export const NodeTextEdit: React.FC = () => {
  const editor = useEditorContext();

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const [isOpen, open, close] = useModal(false);
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const ref = useRef<HTMLSpanElement>(null);

  const handleSubmit = useCallback(() => {
    const el = ref.current;
    const value = (el?.textContent ?? '').trim();

    if (!el || !nodeData) return;

    // editor.container.machineController.changeNoteText(note.id, value);
  }, [editor, nodeData]);

  const handleClose = useCallback(() => {
    handleSubmit();
    // note?.setVisible(true);

    close();
  }, [close, handleSubmit, nodeData]);

  useEffect(() => {
    window.addEventListener('wheel', handleClose);
    return () => window.removeEventListener('wheel', handleClose);
  }, [handleClose]);

  useEffect(() => {
    editor.container.statesController.on('changeState', (state) => {
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
      const pY = 10 / editor.manager.data.scale;
      const borderRadius = 6 / editor.manager.data.scale;

      setNodeData({
        node: state,
        type: 'state',
        initialValue: `entry/
      LED1.on()
      timer1.start(1000)
      timer1.stop(1000)`,
      });
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: width + 'px',
        height: height - state.computedTitleSizes.height + 'px',
        minHeight: fontSize + pY * 2 + 'px',
        fontSize: fontSize + 'px',
        padding: `${pY}px 0`,
        borderRadius: `0px 0px ${borderRadius}px ${borderRadius}px`,
      });
      open();

      // TODO(bryzZz) Фокус не работает совсем
      editorRef.current.view?.dispatch({
        selection: {
          anchor: 2,
          head: 2,
        },
      });
    });

    editor.container.transitionsController.on('changeTransition', (transition) => {
      if (!editor.textMode || !editorRef.current) return;

      editor.container.machineController.removeSelection();

      const globalOffset = editor.container.app.mouse.getOffset();
      const statePos = transition.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
      };
      const { width, height } = transition.drawBounds;
      const fontSize = 16 / editor.manager.data.scale;
      const p = 15 / editor.manager.data.scale;
      const borderRadius = 8 / editor.manager.data.scale;

      setNodeData({ node: transition, type: 'transition', initialValue: 'timer1.timeout/' });
      setStyle({
        left: position.x + 'px',
        top: position.y + 'px',
        width: width + 'px',
        height: height + 'px',
        minHeight: fontSize + p * 2 + 'px',
        fontSize: fontSize + 'px',
        padding: `${p}px 0`,
        borderRadius: borderRadius + 'px',
      });
      open();

      // TODO(bryzZz) Фокус
    });
  }, [editor, open]);

  return (
    <CodeMirror
      ref={editorRef}
      theme={themes[nodeData?.type ?? 'state']}
      style={style}
      className={twMerge(
        'fixed overflow-hidden [&_.cm-content]:p-0 [&_.cm-line]:pl-[15px]',
        !isOpen && 'hidden'
      )}
      value={nodeData?.initialValue ?? ''}
      onBlur={close}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
      }}
    />
  );
};
