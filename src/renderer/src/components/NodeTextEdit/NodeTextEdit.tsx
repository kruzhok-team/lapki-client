import React, { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { twMerge } from 'tailwind-merge';

import { useWheel } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { parseStateEvents, parseTransitionEvents } from '@renderer/lib/data/GraphmlParser';
import { Node } from '@renderer/lib/drawable/Node';
import { useEditorContext } from '@renderer/store/EditorContext';

import './style.css';

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
  const [paddingLeft, setPaddingLeft] = useState('');

  const handleSubmit = useCallback(() => {
    const codeEditor = editorRef.current;

    if (!codeEditor || !nodeData) return;

    const text = codeEditor.state?.doc.toString();
    console.log('here', text, codeEditor);

    if (!text) return;

    if (nodeData.type === 'state') {
      console.log(parseStateEvents(text));
    } else {
      console.log(parseTransitionEvents(text));
    }

    // editor.container.machineController.changeNoteText(note.id, value);
  }, [nodeData]);

  const handleClose = useCallback(() => {
    handleSubmit();
    // note?.setVisible(true);

    close();
  }, [close, handleSubmit]);

  const placeCaretAtEnd = useCallback(() => {
    setTimeout(() => {
      const view = editorRef?.current?.view;
      if (!view) return;

      view.focus();
      view.dispatch({
        selection: {
          anchor: view.state.doc.length,
          head: view.state.doc.length,
        },
      });
    }, 0);
  }, []);

  useWheel(handleClose);

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
      const pX = 15 / editor.manager.data.scale;
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
        minHeight: height - state.computedTitleSizes.height + 'px',
        fontSize: fontSize + 'px',
        padding: `${pY}px 0`,
        borderRadius: `0px 0px ${borderRadius}px ${borderRadius}px`,
      });
      setPaddingLeft(pX + 'px');

      open();
      // placeCaretAtEnd();
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
        minHeight: height + 'px',
        fontSize: fontSize + 'px',
        padding: `${p}px 0`,
        borderRadius: borderRadius + 'px',
      });
      setPaddingLeft(p + 'px');

      open();
      placeCaretAtEnd();
    });
  }, [editor, open, placeCaretAtEnd]);

  // console.log(nodeData?.initialValue ?? '', editorRef.current?.state);

  return (
    <CodeMirror
      ref={editorRef}
      style={style}
      data-pl={paddingLeft}
      className={twMerge('fixed overflow-hidden', nodeData?.type ?? 'state', !isOpen && 'hidden')}
      value={nodeData?.initialValue ?? ''}
      onBlur={handleClose}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
      }}
    />
  );
};
