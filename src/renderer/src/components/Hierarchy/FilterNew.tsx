import React, { useState } from 'react';

import { TreeItemIndex } from 'react-complex-tree';

import { ReactComponent as CollapseIcon } from '@renderer/assets/icons/collapse-all.svg';
import { ReactComponent as ExpandIcon } from '@renderer/assets/icons/expand-all.svg';
import { ReactComponent as SearchIcon } from '@renderer/assets/icons/search.svg';
import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';

import { TextInput } from '../UI';

interface FilterNewProps {
  hierarchy: HierarchyItem;
  expandedItems: TreeItemIndex[];
  setExpandedItems: (expanded: TreeItemIndex[]) => void;
}

export const FilterNew: React.FC<FilterNewProps> = (props) => {
  const { expandedItems, hierarchy, setExpandedItems } = props;

  const [search, setSearch] = useState('');

  const expandAll = expandedItems.length === 0;

  const handleClick = () => {
    if (expandAll) {
      const items = Object.entries(hierarchy)
        .filter(([, item]) => item.isFolder)
        .map(([key]) => key);

      return setExpandedItems(items);
    }

    setExpandedItems([]);
  };

  return (
    <div className="mb-2 flex items-end gap-2">
      <label className="flex items-center border-b border-border-primary">
        {/* <SearchIcon className="h-6 w-6" /> */}
        <TextInput
          className="border-none p-1"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="rounded text-border-primary hover:text-text-primary"
        onClick={handleClick}
      >
        {expandAll ? <ExpandIcon /> : <CollapseIcon />}
      </button>
    </div>
  );
};
