import React, { useRef, useState } from 'react';

import {
  useFloating,
  useHover,
  FloatingPortal,
  useInteractions,
  offset as offsetMiddleware,
  flip,
  shift,
  FloatingArrow,
  arrow,
  Placement,
  OffsetOptions,
  useTransitionStyles,
} from '@floating-ui/react';

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

  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      transform: 'translateX(2px)',
      opacity: 0,
    },
  });

  return (
    <>
      {children({
        ref: refs.setReference,
        ...getReferenceProps(),
        'data-with-hint': true,
      })}

      {isMounted && hint && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
            <div
              className="max-w-sm whitespace-pre-wrap rounded-sm border border-border-primary bg-bg-secondary px-2 py-1 shadow-xl"
              style={styles}
            >
              {hint}
              <FloatingArrow
                className="fill-bg-secondary"
                ref={arrowRef}
                context={context}
                stroke={getColor('border-primary')}
                strokeWidth={0.5}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
