import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface DiagramEditorProps {
  fileContent: string;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ fileContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {}, [fileContent]);

  return <div ref={containerRef} />;
};
