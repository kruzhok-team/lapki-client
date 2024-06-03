import { useRef } from 'react';

/**
 * Позволяет получить значение из предыдущего React рендера
 */
export const usePrevious = <T>(value: T) => {
  const currentRef = useRef(value);
  const previousRef = useRef<T>();

  if (currentRef.current !== value) {
    previousRef.current = currentRef.current;
    currentRef.current = value;
  }

  return previousRef.current;
};
