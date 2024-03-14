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

import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';
import { Checkbox } from '@renderer/components/UI';
import { Tutorial } from '@renderer/store/Tutorial';
import { useTutorialContext } from '@renderer/store/TutorialContext';
import { getColor } from '@renderer/theme';

import { useIsVisibleFloating } from './useIsVisibleFloating';

interface TutorialItemProps {
  children: (props: Record<string, any>) => React.ReactNode;
  id: string;
}

interface TutorialItemWithTutorialProps extends TutorialItemProps {
  tutorial: Tutorial;
  tutorialItem: Main['tutorial']['items'][string];
}

export const TutorialItemWithTutorial: React.FC<TutorialItemWithTutorialProps> = (props) => {
  const { children, id, tutorial, tutorialItem } = props;

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

  const isVisible = useIsVisibleFloating(context, { tutorial, id });
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
              className="max-w-sm whitespace-pre-wrap rounded-sm border border-border-primary bg-bg-secondary py-2 shadow-xl"
              style={styles}
            >
              <div className="flex justify-between pl-4 pr-2">
                <h3 className="text-lg">{tutorialItem.title}</h3>

                <button
                  className="rounded-full p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
                  onClick={() => context.onOpenChange(false)}
                >
                  <Close width="1rem" height="1rem" />
                </button>
              </div>

              <div className="px-4">
                <p className="mb-2 text-base">{tutorialItem.content}</p>

                <button
                  className="btn-primary mb-2 ml-auto block"
                  onClick={() => context.onOpenChange(false)}
                >
                  Ок
                </button>

                <label className="flex cursor-pointer items-center justify-end gap-2 text-sm">
                  Больше не показывать подсказки <Checkbox />
                </label>
              </div>

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

export const TutorialItem: React.FC<TutorialItemProps> = (props) => {
  const tutorial = useTutorialContext();

  const tutorialItem = tutorial.useGetItem(props.id);

  if (tutorialItem && !tutorialItem.showed) {
    return <TutorialItemWithTutorial {...props} tutorial={tutorial} tutorialItem={tutorialItem} />;
  }

  return props.children({});
};
