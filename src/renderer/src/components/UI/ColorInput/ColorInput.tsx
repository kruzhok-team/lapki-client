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
  FloatingPortal,
} from '@floating-ui/react';
import { HexColorPicker } from 'react-colorful';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ClearIcon } from '@renderer/assets/icons/clear.svg';
import { ReactComponent as ColorPalette } from '@renderer/assets/icons/color_palette.svg';
import { useClickOutside } from '@renderer/hooks';
import { getColor } from '@renderer/theme';
import { presetColors, randomColor } from '@renderer/utils';

import './style.css';

interface BaseColorInputProps {
  onClose?: () => void;
}

interface ClearableColorInputProps extends BaseColorInputProps {
  clearable: true;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

interface NonClearableColorInputProps extends BaseColorInputProps {
  clearable: false;
  value: string;
  onChange: (value: string) => void;
}

type ColorInputProps = ClearableColorInputProps | NonClearableColorInputProps;

export const ColorInput: React.FC<ColorInputProps> = (props) => {
  const { value, onChange, onClose, clearable } = props;

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

  const handleClose = () => {
    context.onOpenChange(false);
    onClose?.();
  };

  useClickOutside(
    refs.floating.current,
    handleClose,
    !isOpen,
    refs.reference.current as HTMLElement
  );

  return (
    <>
      <button
        type="button"
        className={twMerge(
          'grid h-7 w-7 cursor-pointer place-content-center rounded',
          !value && 'border border-border-primary'
        )}
        style={{ backgroundColor: value }}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {!value && <ClearIcon className="size-5" />}
      </button>

      {isOpen && (
        <FloatingPortal>
          <div
            id="color-picker"
            className="z-[100] max-w-52 rounded border border-border-primary bg-bg-secondary p-1 shadow-xl"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleClose();
              }
            }}
          >
            <FloatingArrow
              className="fill-bg-secondary"
              ref={arrowRef}
              context={context}
              stroke={getColor('border-primary')}
              strokeWidth={0.5}
            />
            <HexColorPicker className="mb-2" color={value} onChange={onChange} />
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {presetColors.map((presetColor) => (
                <button
                  className="size-8 cursor-pointer rounded"
                  type="button"
                  key={presetColor}
                  style={{ background: presetColor }}
                  onClick={() => onChange(presetColor)}
                />
              ))}
              {clearable && (
                <button
                  className="grid size-8 cursor-pointer place-content-center rounded border border-border-primary text-text-inactive hover:bg-bg-hover active:bg-bg-active"
                  type="button"
                  onClick={() => onChange(undefined)}
                >
                  <ClearIcon className="size-5" />
                </button>
              )}
            </div>
            <button
              className="btn mt-1 flex w-full items-center gap-2 border-border-primary pl-4 pr-6 hover:bg-bg-hover active:bg-bg-active"
              type="button"
              onClick={() => onChange(randomColor())}
            >
              <ColorPalette className="size-6" /> Случайный цвет
            </button>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
