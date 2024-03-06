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
import { useIsVisibleFloating } from '@renderer/hooks';
import { getColor } from '@renderer/theme';

const tutorial = {
  items: [
    {
      id: '1',
      title: 'Пример',
      content: 'Попробуй добавить новый компонент',
    },
    {
      id: '2',
      title: 'Иерархия состояний',
      content: 'Иерархия состояний позволяет посмотреть компоненты схемы ввиде списка',
    },
  ],
};

interface TutorialItemProps {
  children: (props: Record<string, any>) => React.ReactNode;
  id: string;
}

export const TutorialItem: React.FC<TutorialItemProps> = ({ children, id }) => {
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

  const isVisible = useIsVisibleFloating(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([isVisible]);

  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      transform: 'translateX(2px)',
      opacity: 0,
    },
  });

  const tutorialItem = tutorial.items.find((item) => item.id === id);

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
