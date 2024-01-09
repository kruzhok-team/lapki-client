import React, { useRef, useState } from 'react';

import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
  FloatingOverlay,
} from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
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
    placement: 'right-end',
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

  const data = [
    {
      title: 'Вложенность',
      children: [
        {
          text: 'Развернуть всё',
          hint: 'Показывает все вложенные состояния и связи в иерархии',
          type: 'radio',
        },
        {
          text: 'Свернуть всё',
          hint: 'Сворачивает все вложенные состояния и связи в иерархии',
          type: 'radio',
        },
      ],
    },
    //Убрать из под комментария, если захочется проверить работу вкладок
    /*{
      title: 'Состояние',
      children: [
        {
          text: 'Начальное состояние №1',
          hint: 'Пока находится в разработке, добавлен для тестирования, для реализаций оставшихся функций фильтра',
          type: 'checkbox',
        },
        {
          text: 'Начальное состояние №2',
          hint: 'Пока находится в разработке, добавлен для тестирования, для реализаций оставшихся функций фильтра',
          type: 'checkbox',
        },
      ],
    },*/
  ];

  const [show, setShow] = useState('Вложенность');
  //Показываем лишь одну из необходимых вкладок фильтра
  const toggleShow = (title: string) => {
    return setShow(title);
  };

  const [inputText, setInputText] = useState('');
  const onChange = (e) => {
    setInputText(e.target.value);
    find(e);
  };

  //Очищаем весь фильтр
  const clear = () => {
    //Сворачиваем все состояния и очищаем фильтр вложенности
    handleCollapse();
    setCheckBox(undefined);
    //Очищаем поиск
    setInputText('');
  };
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
        <FloatingOverlay className="z-10">
          <div ref={refs.setFloating} style={floatingStyles} className="ml-2">
            {/* <FloatingArrow ref={arrowRef} context={context} fill="inherit" /> */}
            <div className="relative rounded bg-bg-secondary p-3 shadow-xl">
              <div className="mb-3 flex justify-between">
                <h3 className="font-semibold">Фильтр</h3>
                <button className="text-red-500" onClick={clear}>
                  Очистить
                </button>
              </div>
              <WithHint
                hint="Позволяет найти необходимое состояние(связь) за считанные секунды"
                placement="right"
                offset={5}
                delay={100}
              >
                {(props) => (
                  <div className="mb-3 flex items-center">
                    <span className="absolute pl-4">
                      <SearchIcon />
                    </span>
                    <TextInput
                      onChange={onChange}
                      {...props}
                      //Пока оставлю, вдруг пригодится
                      //onBlur={(e) => (e.target.value = '')}
                      placeholder="Поиск..."
                      label={''}
                      value={inputText}
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

              {data.map(({ title, children }, key) => (
                <div key={key}>
                  {children && (
                    <>
                      <button
                        className="my-3 flex w-full justify-between border-b border-border-primary"
                        onClick={() => toggleShow(title)}
                      >
                        <h6>{title}</h6>
                        <ArrowIcon
                          className={twMerge(
                            'rotate-0 transition-transform',
                            show === title && 'rotate-180'
                          )}
                        />
                      </button>
                      <ul className={twMerge('hidden space-y-2', show === title && 'block')}>
                        {children.map(({ text, hint, type }, i) => (
                          <WithHint key={i} hint={hint} placement="right" offset={5} delay={100}>
                            {(props) => (
                              <li className="flex">
                                <label className="flex items-center" {...props}>
                                  {type === 'radio' ? (
                                    <input
                                      type={type}
                                      value={text}
                                      name={text}
                                      onChange={() => handleInputChange(text)}
                                      checked={text === checkBox}
                                      className="mx-2 h-4 w-4"
                                    />
                                  ) : (
                                    <input
                                      type={type}
                                      value={text}
                                      name={text}
                                      className="mx-2 h-4 w-4"
                                    />
                                  )}

                                  {' ' + text}
                                </label>
                              </li>
                            )}
                          </WithHint>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </FloatingOverlay>
      )}
    </div>
  );
};
