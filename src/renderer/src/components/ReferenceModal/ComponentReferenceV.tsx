import React, { useEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { getPlatform, loadPlatform } from '@renderer/lib/data/PlatformLoader';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { Picto } from '@renderer/lib/drawable';
import { ComponentProto } from '@renderer/types/platform';

import { ComponentInfo } from './ComponentInfo';

import { ParameterSelect, ParameterSelectOption } from '../UI';

const picto = new Picto();

type ComponentEntry = ComponentProto & {
  idx: string;
};

export type ComponentReferenceProps = {
  platformIdx: string;
};

export const ComponentReferenceV: React.FC<ComponentReferenceProps> = ({ platformIdx }) => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [entry, setEntry] = useState<ComponentEntry | null>(null);
  const [manager, setManager] = useState<PlatformManager | null>(null);
  const [platformComponents, setPlatformComponents] = useState<ComponentEntry[]>([]);
  const [componentOptions, setComponentOptions] = useState<ParameterSelectOption[]>([]);

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
    const options: ParameterSelectOption[] = components.map((c) => ({
      value: c.idx,
      label: c.name || c.idx,
      icon: manager.getRawComponentIcon(c.idx, 'mr-2 size-5'),
    }));
    setPlatformComponents(components);
    setComponentOptions(options);
    setEntry(null);
    setCursor(null);
  }, [platformIdx]);

  const onCompClick = (entry: SingleValue<ParameterSelectOption>) => {
    const idx = entry?.value ?? null;
    setCursor(idx);
    if (idx) {
      const selectedEntry = platformComponents.find((c) => c.idx === idx) ?? null;
      setEntry(selectedEntry);
    } else {
      setEntry(null);
    }
  };

  const description = useMemo(() => {
    if (!manager || componentOptions.length === 0) {
      return '';
    }
    if (!entry) return '';
    return (
      <ComponentInfo
        component={entry}
        manager={manager}
        className="mt-6 min-h-0 flex-1"
        noTitle={true}
        noTypeIcons={true}
      />
    );
  }, [entry, manager, componentOptions]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ParameterSelect
        className="w-full"
        indicatorClassName="text-black"
        options={componentOptions}
        value={componentOptions.find((o) => o.value === cursor) ?? null}
        onChange={onCompClick}
        placeholder="Выберите компонент..."
        isClearable={false}
        isSearchable={true}
        noOptionsMessage={() => <div>Отсутствуют подходящие компоненты</div>}
      />
      {description}
    </div>
  );
};

export default ComponentReferenceV;
