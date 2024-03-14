import React, { useMemo } from 'react';

import { ReactComponent as ArrowRight } from '@renderer/assets/icons/arrow-right.svg';
import { File } from '@renderer/types/documentation';

interface NavigationProps {
  data: { body: File } | undefined;
  onItemClick: (filePath: string) => void;
  currentPath: string | undefined;
}

export const Navigation: React.FC<NavigationProps> = ({ data, onItemClick, currentPath }) => {
  const flattenedList = useMemo(() => {
    if (!data) return [];
    const flattenDocuments = (documents: File[] | undefined) => {
      if (!documents) return [];

      let result: string[] = [];

      documents.forEach((doc) => {
        if (doc.children) {
          result = result.concat(flattenDocuments(doc.children));
        } else if (doc.path) {
          result.push(doc.path);
        }
      });

      return result;
    };

    const updatedFlattenedList = flattenDocuments(data.body.children);
    return updatedFlattenedList;
  }, [data]);

  const handleBackClick = () => {
    if (!currentPath) return;
    const currentIndex = flattenedList.findIndex((value) => value === currentPath);

    if (currentIndex === 0) return;

    const backIndex = currentIndex - 1;
    const back = flattenedList[backIndex];

    if (back) {
      onItemClick(back);
    }
  };

  const handleForwardClick = () => {
    if (!currentPath) return;
    const currentIndex = flattenedList.findIndex((value) => value === currentPath);
    let forwardIndex = 0;

    if (currentIndex !== flattenedList.length - 1) {
      forwardIndex = currentIndex + 1;
    }

    const forward = flattenedList[forwardIndex];

    if (forward) {
      onItemClick(forward);
    }
  };

  const backDisabled = currentPath === flattenedList[0];
  const forwardLabel =
    flattenedList[flattenedList.length - 1] === currentPath ? 'В начало' : 'Вперёд';

  return (
    <div className="m-2 flex justify-between gap-2">
      <button
        className="btn-secondary flex w-full items-center justify-center gap-1"
        disabled={backDisabled}
        onClick={handleBackClick}
      >
        <ArrowRight className="h-5 w-6 rotate-180" />
        Назад
      </button>
      <button
        className="btn-secondary flex w-full items-center justify-center gap-1"
        onClick={handleForwardClick}
      >
        {forwardLabel}
        <ArrowRight className="h-5 w-6" />
      </button>
    </div>
  );
};
