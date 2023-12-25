import { useRef, useState } from 'react';

import {
  useFloating,
  arrow,
  FloatingArrow,
  offset,
  shift,
  flip,
  useTransitionStyles,
  autoUpdate,
} from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';

import { ReactComponent as SearchIcon } from '@renderer/assets/icons/search.svg';
import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';

import { WithHint } from './WithHint';

export interface FilterProps {
  data: HierarchyItem;
  find: (e) => void;
  handleExpanded: () => void;
  handleCollapse: () => void;
}

export const Filter: React.FC<FilterProps> = ({ find, handleExpanded, handleCollapse }) => {
  const ARROW_WIDTH = 30;
  const ARROW_HEIGHT = 15;
  const [placement] = useState<Placement>('right');
  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef(null);

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(ARROW_HEIGHT),
      flip({ padding: 5 }),
      shift({ padding: 5 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const arrowX = middlewareData.arrow?.x ?? 0;
  const arrowY = middlewareData.arrow?.y ?? 0;
  const transformX = arrowX + ARROW_WIDTH / 2;
  const transformY = arrowY + ARROW_HEIGHT;

  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      transform: 'scale(0)',
    },
    common: ({ side }) => ({
      transformOrigin: {
        top: `${transformX}px calc(100% + ${ARROW_HEIGHT}px)`,
        bottom: `${transformX}px ${-ARROW_HEIGHT}px`,
        left: `calc(100% + ${ARROW_HEIGHT}px) ${transformY}px`,
        right: `${-ARROW_HEIGHT}px ${transformY}px`,
      }[side],
    }),
  });

  const [checkBox, setCheckBox] = useState();
  const handleInputChange = (score) => {
    setCheckBox(score);
    if (score === 'Развернуть всё') {
      return handleExpanded();
    }
    return handleCollapse();
  };

  const handleButton = [
    {
      text: 'Развернуть всё',
      hint: 'Показывает все вложенные состояния и связи в иерархии',
    },
    {
      text: 'Свернуть всё',
      hint: 'Сворачивает все вложенные состояния и связи в иерархии',
    },
  ];

  return (
    <div className="flex items-center justify-center">
      <button
        ref={refs.setReference}
        className="btn-primary reference mb-2"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        Фильтр
      </button>

      {isMounted && (
        <div ref={refs.setFloating} style={floatingStyles} className="z-10">
          <div style={styles} className="relative rounded-lg p-3">
            <FloatingArrow
              ref={arrowRef}
              context={context}
              width={ARROW_WIDTH}
              height={ARROW_HEIGHT}
              color="white"
            />
            <WithHint
              hint="Позволяет найти необходимое состояние(связь) за считанные секунды"
              placement="right"
              offset={5}
              delay={100}
            >
              {(props) => (
                <div className="mb-2 flex items-center">
                  <span className="absolute pl-2">
                    <SearchIcon />
                  </span>
                  <input
                    className="flex h-10 w-full gap-3 rounded border-white bg-transparent pl-10 pr-2 text-current ring-2 focus:border-[#0c4bee] focus:outline-none focus:ring-2 focus:ring-[#0c4bee]"
                    onChange={(e) => {
                      find(e);
                    }}
                    {...props}
                    type="search"
                    onBlur={(e) => (e.target.value = '')}
                    placeholder="Поиск..."
                  />
                </div>
              )}
            </WithHint>
            <h6 className="mb-3 text-sm font-medium">Фильтр</h6>
            <ul className="space-y-2 text-sm">
              {handleButton.map(({ text, hint }, i) => (
                <WithHint key={i} hint={hint} placement="right" offset={5} delay={100}>
                  {(props) => (
                    <li className="flex items-center">
                      <label className="ml-2 text-sm font-medium" {...props}>
                        <input
                          type="radio"
                          value={text}
                          name={text}
                          onChange={() => handleInputChange(text)}
                          checked={text === checkBox}
                          className="text-primary-600 h-4 w-4 border-gray-300 bg-gray-100"
                        />
                        {' ' + text}
                      </label>
                    </li>
                  )}
                </WithHint>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
