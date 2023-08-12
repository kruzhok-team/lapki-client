import React, { useMemo, useState, useRef } from 'react';

import { Panel, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { twMerge } from 'tailwind-merge';

import {
  Explorer,
  Menu,
  Compiler,
  Loader,
  MenuProps,
  CompilerProps,
  FlasherProps,
} from '../components';

import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as DriveIcon } from '@renderer/assets/icons/drive.svg';
//import { ReactComponent as ChipIcon } from '@renderer/assets/icons/chip.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { Setting } from './Setting';
import { EditorRef } from './utils/useEditorManager';

interface SidebarProps {
  minSize: number;
  editorRef: EditorRef;
  menuProps: MenuProps;
  compilerProps: CompilerProps;
  flasherProps: FlasherProps;
}

const items = [
  {
    svgIcon: <MenuIcon />,
  },
  {
    svgIcon: <ComponentsIcon />,
  },
  {
    svgIcon: <CompilerIcon />,
  },
  {
    svgIcon: <DriveIcon />,
  },
  // {
  //   svgIcon: <ChipIcon />,
  // },
  {
    svgIcon: <SettingsIcon />,
    style: true,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  minSize,
  flasherProps,
  compilerProps,
  editorRef,
  menuProps,
}) => {
  const panelRef = useRef<ImperativePanelHandle>(null);

  const [activeTab, setActiveTab] = useState(0);

  const handleClick = (i: number) => () => {
    const panel = panelRef.current;

    if (i === activeTab && panel) {
      if (panel.getCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }

      return;
    }

    setActiveTab(i);
    const newPanel = panelRef.current;
    if (newPanel?.getCollapsed()) {
      newPanel.expand();
    }
  };

  const tabs = useMemo(
    () => [
      <Menu {...menuProps} />,
      <Explorer editorRef={editorRef} />,
      <Compiler {...compilerProps} />,
      <Loader {...flasherProps} />,
      <Setting />,
    ],
    [editorRef, compilerProps, flasherProps]
  );

  return (
    <>
      <div className="flex flex-col gap-4 bg-white p-2 ">
        {items.map(({ svgIcon, style }, i) => (
          <button key={i} className={twMerge('w-8', style && 'mt-auto')} onClick={handleClick(i)}>
            {svgIcon}
          </button>
        ))}
      </div>

      <Panel collapsible={true} minSize={minSize} defaultSize={minSize} ref={panelRef}>
        <div className="h-full w-full">
          {tabs.map((Element, i) => (
            <div
              key={i}
              className={twMerge(
                'hidden h-full border-l-4 border-[#a1c8df]',
                i === activeTab && 'block'
              )}
            >
              {Element}
            </div>
          ))}
        </div>
      </Panel>

      <PanelResizeHandle className="group">
        <div className="h-full w-1 bg-[#4391BF] bg-opacity-50 transition-colors group-hover:bg-opacity-100 group-data-[resize-handle-active]:bg-opacity-100" />
      </PanelResizeHandle>
    </>
  );
};
