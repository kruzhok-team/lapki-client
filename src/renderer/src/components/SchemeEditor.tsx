import { useEffect, useRef } from 'react';

import { useSettings } from '@renderer/hooks';
import { useSchemeContext } from '@renderer/store/SchemeContext';

export const SchemeEditor: React.FC = () => {
  const scheme = useSchemeContext();

  const [canvasSettings] = useSettings('canvas');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    scheme.mount(containerRef.current);

    //! Не забывать удалять слушатели
    return () => {
      scheme.unmount();
    };
  }, [scheme]);

  useEffect(() => {
    if (!canvasSettings) return;

    scheme.setSettings(canvasSettings);
  }, [canvasSettings, scheme]);

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>
    </>
  );
};
