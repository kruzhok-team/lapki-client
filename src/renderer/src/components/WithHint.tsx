import React, { useRef, useState } from 'react';

import {
  useFloating,
  useHover,
  useInteractions,
  offset as offsetMiddleware,
  flip,
  shift,
  FloatingArrow,
  arrow,
  Placement,
  OffsetOptions,
} from '@floating-ui/react';
import { createPortal } from 'react-dom';

import { getColor } from '@renderer/theme';

interface WithHintProps {
  children: (props: Record<string, any>) => React.ReactNode;
  hint: React.ReactNode;
  offset?: OffsetOptions;
  placement?: Placement;
  delay?: number;
}

export const WithHint: React.FC<WithHintProps> = ({
  children,
  hint,
  offset = 10,
  placement = 'bottom',
  delay,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef<SVGSVGElement | null>(null);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offsetMiddleware(offset),
      flip(),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });
  const hover = useHover(context, {
    delay,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      {children({
        ref: refs.setReference,
        ...getReferenceProps(),
        'data-with-hint': true,
      })}
      {isOpen &&
        hint &&
        createPortal(
          <div
            className="z-[100] max-w-sm rounded-sm border border-border-primary bg-bg-secondary px-2 py-1 shadow-xl transition-opacity"
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
            {hint}
          </div>,
          document.body
        )}
    </>
  );
};
