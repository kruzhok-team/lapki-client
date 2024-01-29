import React, { RefObject, useCallback, useRef, useState } from 'react';

import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  //FloatingArrow,
  FloatingOverlay,
} from '@floating-ui/react';
import { TreeItemIndex, TreeRef } from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { ReactComponent as FilterIcon } from '@renderer/assets/icons/filter.svg';
import { ReactComponent as SearchIcon } from '@renderer/assets/icons/search.svg';
import { useClickOutside } from '@renderer/hooks';
import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';

import { TextInput } from '../UI/TextInput';
import { WithHint } from '../UI/WithHint';

export interface FilterProps {
  tree: RefObject<TreeRef>;
  hierarchy: HierarchyItem;
  setExpandedItems: (expanded: TreeItemIndex[]) => void;
}

export const Filter: React.FC<FilterProps> = (props) => {
  const { tree, hierarchy, setExpandedItems } = props;

  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const [search, setSearch] = useState<string>('');

  const findItemPath = useCallback(
    async (e, searchRoot = 'root') => {
      const item = await hierarchy[searchRoot];
      if (item.data.toLowerCase().includes(e.toLowerCase())) {
        return [item.index];
      }
      const searchedItems = await Promise.all(
        (item.children && item.children.map((child) => findItemPath(e, child))) || []
      );
      const result = searchedItems.find((item) => item !== null);
      if (!result) {
        return null;
      }
      return [item.index, ...result];
    },
    [hierarchy]
  );

  //Функции для поиска в иерархии состояний
  const find = useCallback(
    (e) => {
      e.preventDefault();
      setSearch(e.target.value);
      if (!search) return;
      findItemPath(search).then((path) => {
        if (!path) return;
        tree.current?.expandSubsequently(path.slice(0, path.length - 1)).then(() => {
          tree.current?.selectItems([path[path.length - 1]]);
        });
      });
    },
    [findItemPath, search, tree]
  );

  const { refs, floatingStyles /*context*/ } = useFloating({
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

  const [checked, setChecked] = useState('Свернуть всё');

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
      onClick: (e) => {
        setChecked(e.target.value);
        setExpandedItems([]);
        if (e.target.value === 'Развернуть всё') {
          return tree.current?.expandAll();
        }
        return tree.current?.collapseAll();
      },
    },
    // {
    //   title: 'Состояние',
    //   children: [
    //     {
    //       text: 'Начальное состояние',
    //       hint: 'Показывает начальное состояние в иерархии',
    //       type: 'checkbox',
    //     },
    //   ],
    //   // eslint-disable-next-line @typescript-eslint/no-empty-function
    //   onClick: () => {},
    // },
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
    setExpandedItems([]);
    tree.current?.collapseAll();
    setChecked('Свернуть всё');
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
                      hidden={false}
                      error={false}
                      errorMessage={''}
                    />
                  </div>
                )}
              </WithHint>

              {data.map(({ title, children, onClick }, key) => (
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
                                <label className="flex items-center" onClick={onClick} {...props}>
                                  {type === 'radio' ? (
                                    <input
                                      type={type}
                                      value={text}
                                      checked={checked === text}
                                      className="mx-2 h-4 w-4"
                                    />
                                  ) : (
                                    <input
                                      type={type}
                                      value={text}
                                      onClick={() => onClick(text)}
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
