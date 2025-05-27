import React, { useEffect, useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { getPlatform, loadPlatform } from '@renderer/lib/data/PlatformLoader';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { icons, Picto } from '@renderer/lib/drawable';
import { ComponentProto } from '@renderer/types/platform';

import ComponentInfo from './ComponentInfo';

import { ScrollableList } from '../ScrollableList';

const picto = new Picto();

type ComponentEntry = ComponentProto & {
  idx: string;
};

export type ComponentReferenceProps = {
  platformIdx: string;
};

export const ComponentReference: React.FC<ComponentReferenceProps> = ({ platformIdx }) => {
  const [cursor, setCursor] = useState<ComponentEntry | null>(null);
  const [manager, setManager] = useState<PlatformManager | null>(null);
  const [platformComponents, setPlatformComponents] = useState<ComponentEntry[]>([]);

  const resetData = () => {
    setCursor(null);
    setManager(null);
    setPlatformComponents([]);
  };

  useEffect(() => {
    const platformData = getPlatform(platformIdx);
    if (!platformData) {
      console.error(`Platform with index ${platformIdx} not found.`);
      resetData();
      return;
    }
    const manager = loadPlatform(platformIdx);
    if (!manager) {
      console.error(`Failed to load platform manager for ${platformIdx}.`);
      resetData();
      return;
    }
    manager.picto = picto;
    setManager(manager);

    if (!platformData.components) {
      console.warn(`No components found for platform ${platformIdx}.`);
      resetData();
      return;
    }
    const components: ComponentEntry[] = Object.entries(platformData.components).map(
      ([idx, data]) => ({
        ...data,
        idx,
      })
    );
    setPlatformComponents(components);
    setCursor(null);
  }, [platformIdx]);

  const onCompClick = (entry: ComponentEntry) => {
    setCursor(entry);
  };

  const description = useMemo(() => {
    if (!manager || platformComponents.length === 0) {
      return 'Нет доступных компонентов для отображения.';
    }
    if (!cursor) return 'Выберите компонент для просмотра описания.';
    return <ComponentInfo component={cursor} manager={manager} className="max-h-[40vh]" />;
  }, [cursor, manager, platformComponents]);

  return (
    <div className="grid max-h-[40vh] grid-cols-[2fr_3fr] gap-4">
      <ScrollableList
        className="max-h-[40vh]"
        listItems={platformComponents}
        heightOfItem={10}
        maxItemsToRender={50}
        renderItem={(entry) => (
          <div
            key={entry.idx}
            className={twMerge(
              'flex items-center gap-2 p-1',
              entry.idx == cursor?.idx && 'bg-bg-active'
            )}
            onClick={() => onCompClick(entry)}
          >
            <img
              className="h-8 w-8 object-contain"
              src={icons.get(entry.img || 'stubComponent')?.src ?? UnknownIcon}
            />
            <p className="line-clamp-1">{entry.name ?? entry.idx}</p>
          </div>
        )}
      />
      <div className="">{description}</div>
    </div>
  );
};

export default ComponentReference;
