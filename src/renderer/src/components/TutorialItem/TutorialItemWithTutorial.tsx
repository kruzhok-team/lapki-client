import React, { useRef, useState } from 'react';

import {
  useFloating,
  FloatingPortal,
  useInteractions,
  offset as offsetMiddleware,
  flip,
  shift,
  FloatingArrow,
  arrow,
  useTransitionStyles,
} from '@floating-ui/react';

import { Checkbox } from '@renderer/components/UI';
import { getColor } from '@renderer/theme';

interface TutorialItemWithTutorialProps {
  children: (props: Record<string, any>) => React.ReactNode;
  id: string;
}

export const TutorialItemWithTutorial: React.FC<TutorialItemWithTutorialProps> = ({
  children,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef<SVGSVGElement | null>(null);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'right',
    middleware: [
      offsetMiddleware(10),
      flip(),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const isVisible = useIsVisibleFloating(context, { tutorial, id, disabled: tutorialItem?.showed });
  const { getReferenceProps, getFloatingProps } = useInteractions([isVisible]);

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
      })}

      {isMounted && tutorialItem && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
            <div
              className="max-w-sm whitespace-pre-wrap rounded-sm border border-border-primary bg-bg-secondary px-4 py-2 shadow-xl"
              style={styles}
            >
              <h3 className="text-lg">{tutorialItem.title}</h3>

              <p className="mb-2 text-base">{tutorialItem.content}</p>

              <p className="flex items-center justify-end gap-2 text-sm">
                Больше не показывать подсказки <Checkbox />
              </p>

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
