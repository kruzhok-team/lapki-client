import React, { useEffect, useMemo, useState } from 'react';

import { Select } from '@renderer/components/UI';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
import { PlatformInfo } from '@renderer/types/platform';

import { ComponentReferenceV } from './ComponentReferenceV';

export const Reference: React.FC = () => {
  const [platformList, setPlatformList] = useState<PlatformInfo[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformInfo | null>(null);

  useEffect(() => {
    const platforms = getAvailablePlatforms();
    if (platforms.length === 0) {
      console.error('Нет доступных платформ для отображения справочника');
      return;
    }
    setPlatformList(platforms);
  }, []);

  useEffect(() => {
    if (platformList.length === 0) {
      setSelectedPlatform(null);
      return;
    }
    if (!selectedPlatform) {
      setSelectedPlatform(platformList[0]);
    }
    // check if the selected platform is still available
    if (!platformList.some((p) => p.idx === selectedPlatform?.idx)) {
      setSelectedPlatform(platformList[0]);
    }
    // (chekoopa): линтер требует selectedPlatform, но он здесь не нужен,
    // т.к. это условие срабатывает только при изменении platformList
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformList]);

  const platformOptions = useMemo(() => {
    return platformList.map((platform) => ({
      value: platform.idx,
      label: platform.name,
    }));
  }, [platformList]);

  const handlePlatformChange = async (platformIdx: string) => {
    const platform = platformList.find((p) => p.idx === platformIdx);
    if (platform) {
      setSelectedPlatform(platform);
    }
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <Select
        containerClassName="w-full"
        options={platformOptions}
        onChange={(opt) => handlePlatformChange(opt?.value ?? '')}
        value={platformOptions.find((o) => o.value === selectedPlatform?.idx)}
        isSearchable={true}
        noOptionsMessage={() => 'Нет доступных платформ'}
      />
      {selectedPlatform && <ComponentReferenceV platformIdx={selectedPlatform.idx} />}
      {!selectedPlatform && (
        <p className="text-text-inactive">
          Пожалуйста, выберите платформу для просмотра компонентов.
        </p>
      )}
    </div>
  );
};

export default Reference;
