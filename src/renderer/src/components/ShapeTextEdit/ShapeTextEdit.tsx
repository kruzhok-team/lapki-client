import React, { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { twMerge } from 'tailwind-merge';

import { useWheel } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import {
  serializeStateEvents,
  serializeTransitionActions,
} from '@renderer/lib/data/GraphmlBuilder';
import { actionsToEventData } from '@renderer/lib/data/GraphmlParser';
import { Shape, State } from '@renderer/lib/drawable';
import { Transition } from '@renderer/lib/drawable/Transition';
import { useEditorContext } from '@renderer/store/EditorContext';

import './style.css';

interface ShapeData {
  node: Shape;
  type: 'state' | 'transition';
  initialValue: string;
}

export const ShapeTextEdit: React.FC = () => {
  const editor = useEditorContext();

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const [isOpen, open, close] = useModal(false);
  const [nodeData, setShapeData] = useState<ShapeData | null>(null);
  const [style, setStyle] = useState({} as CSSProperties);
  const [paddingLeft, setPaddingLeft] = useState('');

  const handleSubmit = useCallback(() => {
    const codeEditor = editorRef.current;

    if (!codeEditor || !nodeData) return;

    const text = codeEditor.view?.state?.doc.toString();

    if (!text) return;

    // if (nodeData.type === 'state') {
    //   console.log(parseStateEvents(text));
    // } else {
    //   console.log(parseTransitionEvents(text));
    // }

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
    const handleChangeState = (state: State) => {
      if (!editor.textMode || !editorRef.current) return;

      editor.controller.removeSelection();

      const globalOffset = editor.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y + state.computedTitleSizes.height,
      };
      const { width, height } = state.drawBounds;
      const fontSize = 16 / editor.model.data.scale;
      const pY = 10 / editor.model.data.scale;
      const pX = 15 / editor.model.data.scale;
      const borderRadius = 6 / editor.model.data.scale;

      setShapeData({
        node: state,
        type: 'state',
        initialValue: serializeStateEvents(state.data.events).join('\n'),
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
      placeCaretAtEnd();
    };

    const handleChangeTransition = (transition: Transition) => {
      if (!editor.textMode || !editorRef.current) return;

      editor.controller.removeSelection();

      const globalOffset = editor.mouse.getOffset();
      const statePos = transition.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
      };
      const { width, height } = transition.drawBounds;
      const fontSize = 16 / editor.model.data.scale;
      const p = 15 / editor.model.data.scale;
      const borderRadius = 8 / editor.model.data.scale;

      setShapeData({
        node: transition,
        type: 'transition',
        initialValue: serializeTransitionActions(
          transition.data.label?.trigger as any,
          transition.data.label?.do ?? []
        ),
      });
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
    };

    editor.controller.states.on('changeState', handleChangeState);
    editor.controller.transitions.on('changeTransition', handleChangeTransition);

    return () => {
      editor.controller.states.off('changeState', handleChangeState);
      editor.controller.transitions.off('changeTransition', handleChangeTransition);
    };
  }, [editor, open, placeCaretAtEnd]);

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
