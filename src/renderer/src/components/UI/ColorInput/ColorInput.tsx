import { useRef, useState } from 'react';

import {
  useFloating,
  useClick,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingArrow,
  arrow,
} from '@floating-ui/react';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';

import { useClickOutside } from '@renderer/hooks';
import { getColor } from '@renderer/theme';
import { presetColors } from '@renderer/utils';

import './style.css';

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = (props) => {
  const { value, onChange } = props;

  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef<SVGSVGElement | null>(null);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const click = useClick(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click]);

  useClickOutside(refs.floating.current, () => setIsOpen(false), !isOpen);

  return (
    <div
      className="h-7 w-7 cursor-pointer rounded"
      style={{ backgroundColor: value }}
      ref={refs.setReference}
      {...getReferenceProps()}
    >
      {isOpen &&
        createPortal(
          <div
            className="z-[100] max-w-sm rounded border border-border-primary bg-bg-secondary p-1 shadow-xl"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <FloatingArrow
              className="fill-bg-secondary"
              ref={arrowRef}
              context={context}
              stroke={getColor('border-primary')}
              strokeWidth={0.5}
            />
            <HexColorPicker className="mb-2" color={value} onChange={onChange} />
            <div className="flex items-center gap-2">
              {presetColors.map((presetColor) => (
                <button
                  className="h-7 w-7 cursor-pointer rounded"
                  type="button"
                  key={presetColor}
                  style={{ background: presetColor }}
                  onClick={() => onChange(presetColor)}
                />
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
