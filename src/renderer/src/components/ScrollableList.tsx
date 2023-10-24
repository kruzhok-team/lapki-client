import React, { ComponentProps, useEffect, useRef, useState } from 'react';

import { twMerge } from 'tailwind-merge';

interface ScrollableListProps<T> {
  listItems: T[];
  renderItem: (item: T) => React.ReactNode;
  heightOfItem?: number;
  maxItemsToRender?: number;
  className?: string;
  containerProps?: Omit<ComponentProps<'div'>, 'className'>;
}

export const ScrollableList = <T,>(props: ScrollableListProps<T>) => {
  const {
    listItems,
    renderItem,
    heightOfItem = 30,
    maxItemsToRender = 50,
    className,
    containerProps,
  } = props;

  const listRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    const updateScrollPosition = () => {
      const newScrollPosition = list.scrollTop / heightOfItem;
      const difference = Math.abs(scrollPosition - newScrollPosition);

      if (difference >= maxItemsToRender / 5) {
        setScrollPosition(newScrollPosition);
      }
    };

    list.addEventListener('scroll', updateScrollPosition);

    return () => {
      list.removeEventListener('scroll', updateScrollPosition);
    };
  }, []);

  const startPosition =
    scrollPosition - maxItemsToRender > 0 ? scrollPosition - maxItemsToRender : 0;

  const endPosition =
    scrollPosition + maxItemsToRender >= listItems.length
      ? listItems.length
      : scrollPosition + maxItemsToRender;

  return (
    <div
      className={twMerge(
        'w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb',
        className
      )}
      ref={listRef}
      {...containerProps}
    >
      <div
        key="list-spacer-top"
        style={{
          height: startPosition * heightOfItem,
        }}
      />

      {listItems.slice(startPosition, endPosition).map(renderItem)}

      <div
        key="list-spacer-bottom"
        style={{
          height: listItems.length * heightOfItem - endPosition * heightOfItem,
        }}
      />
    </div>
  );
};
