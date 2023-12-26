import React, { useRef, useState } from 'react';

import { useFloating, offset, flip, shift, arrow, FloatingArrow } from '@floating-ui/react';

import { ReactComponent as FilterIcon } from '@renderer/assets/icons/filter.svg';
import { ReactComponent as SearchIcon } from '@renderer/assets/icons/search.svg';
import { useClickOutside } from '@renderer/hooks';

import { TextInput } from '../UI/TextInput';
import { WithHint } from '../UI/WithHint';

export interface FilterProps {
  find: (e) => void;
  handleExpanded: () => void;
  handleCollapse: () => void;
}

export const Filter: React.FC<FilterProps> = (props) => {
  const { find, handleExpanded, handleCollapse } = props;

  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: 'right',
    middleware: [
      offset(),
      flip(),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  useClickOutside(refs.floating.current, () => setIsOpen(false), !isOpen);

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
    <div className="justify-left flex items-center">
      <button
        ref={refs.setReference}
        className="btn-primary reference mb-2 flex"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <FilterIcon />
        Фильтр
      </button>

      {isOpen && (
        <div ref={refs.setFloating} style={floatingStyles} className="z-10 ml-2">
          <FloatingArrow ref={arrowRef} context={context} fill="#4b5563" />
          <div className="relative rounded-lg bg-gray-600 p-3">
            <WithHint
              hint="Позволяет найти необходимое состояние(связь) за считанные секунды"
              placement="right"
              offset={5}
              delay={100}
            >
              {(props) => (
                <div className="mb-2 flex items-center">
                  <span className="absolute pl-4">
                    <SearchIcon />
                  </span>
                  <TextInput
                    onChange={(e) => {
                      find(e);
                    }}
                    {...props}
                    onBlur={(e) => (e.target.value = '')}
                    placeholder="Поиск..."
                    label={''}
                    className="h-10 pl-10 pr-2"
                    isHidden={false}
                    error={false}
                    errorMessage={''}
                  />
                  {/* <input
                    className="flex h-10 w-full gap-3 rounded border-white bg-transparent pl-10 pr-2 text-current ring-2 focus:border-[#0c4bee] focus:outline-none focus:ring-2 focus:ring-[#0c4bee]"
                    onChange={(e) => {
                      find(e);
                    }}
                    {...props}
                    type="search"
                    onBlur={(e) => (e.target.value = '')}
                    placeholder="Поиск..."
                  /> */}
                </div>
              )}
            </WithHint>
            <h6 className="mb-3">Фильтр</h6>
            <ul className="space-y-2">
              {handleButton.map(({ text, hint }, i) => (
                <WithHint key={i} hint={hint} placement="right" offset={5} delay={100}>
                  {(props) => (
                    <li className="flex items-center">
                      <label className="ml-2" {...props}>
                        <input
                          type="radio"
                          value={text}
                          name={text}
                          onChange={() => handleInputChange(text)}
                          checked={text === checkBox}
                          className="h-4 w-4 border-gray-300 bg-gray-100"
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
