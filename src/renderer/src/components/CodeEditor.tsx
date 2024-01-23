import React from 'react';

// import Editor, { EditorProps } from '@monaco-editor/react';
import Editor, { loader, EditorProps } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

(self.MonacoEnvironment as any) = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor' || label === 'xml') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }

    return new editorWorker();
  },
};

loader.config({ monaco });
loader.init();

type CodeEditorProps = EditorProps;

export const CodeEditor: React.FC<CodeEditorProps> = ({ ...props }) => {
  return (
    <Editor
      className="absolute h-full overflow-hidden"
      // theme="vs-light"
      // defaultLanguage="json"
      // theme={getColor('codeEditorTheme')}
      theme="vs-dark"
      {...props}
    />
  );
};
