import React, { useMemo, useState, useRef, useCallback } from 'react';

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
  ExplorerCallbacks,
} from '../components';

import MenuImg from '@renderer/assets/icons/menu.svg';
import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as DriveIcon } from '@renderer/assets/icons/drive.svg';
//import { ReactComponent as ChipIcon } from '@renderer/assets/icons/chip.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { Setting } from './Setting';
import { EditorRef } from './utils/useEditorManager';
import usePanelMinSize from './utils/usePanelMinSize';

export interface SidebarCallbacks {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestAddComponent: () => void;
  // TODO: onRequestEditComponent: (name: string) => void;
  // TODO: onRequestRemoveComponent: (name: string) => void;
}

interface SidebarProps {
  editorRef: EditorRef;
  callbacks: SidebarCallbacks;
  compilerProps: CompilerProps;
  flasherProps: FlasherProps;
}

export const Sidebar: React.FC<SidebarProps> = ({
  flasherProps,
  compilerProps,
  editorRef,
  callbacks: {
    onRequestNewFile,
    onRequestOpenFile,
    onRequestSaveFile,
    onRequestSaveAsFile,
    onRequestAddComponent,
  },
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

  const items = useMemo(
    () => [
      {
        svgIcon: (
          <svg overflow="visible" height={32} width={32}>
            <image width={32} href={MenuImg} />
            {editorRef.editorData.modified ? <circle cx={30} cy={3} r={4} fill="#880000ee" /> : ''}
          </svg>
        ),
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
    ],
    [editorRef.editorData]
  );

  const menuProps: MenuProps = {
    onRequestNewFile,
    onRequestOpenFile,
    onRequestSaveFile,
    onRequestSaveAsFile,
  };

  const explorerCallbacks: ExplorerCallbacks = {
    onRequestAddComponent,
  };

  const tabs = useMemo(
    () => [
      <Menu {...menuProps} />,
      <Explorer editorRef={editorRef} callbacks={explorerCallbacks} />,
      <Compiler {...compilerProps} />,
      <Loader {...flasherProps} />,
      <Setting />,
    ],
    [editorRef.editorData, compilerProps, flasherProps]
  );

  // Очень грязный хак для фиксации размера боковой панели при изменении размера.
  // Дёргается, срабатывает через раз, не использует useState, ищет знатока React для починки.
  // FIXME: см. проблему в usePanelMinSize, из-за замыкания setMinSize useState бесполезен
  // const [minSize, setMinSize] = useState(20);
  const onPanelMinSize = useCallback((size: number, prevSize: number) => {
    if (!panelRef.current) return;
    // setMinSize(size);
    const panelSize = panelRef.current.getSize();
    // console.log([`onPanelMinSize size=${size} prevSize=${prevSize} minSize=${minSize}, panelSize=${panelSize}`]);
    if (panelSize < size) {
      // console.log(['onPanelMinSize: fix']);
      panelRef.current.resize(size);
    } else {
      panelRef.current.resize((size / prevSize) * panelSize);
    }
  }, []);
  const { minSizeRef } = usePanelMinSize('group', 250, onPanelMinSize);

  return (
    <>
      <div className="flex flex-col gap-4 bg-white p-2 ">
        {items.map(({ svgIcon, style }, i) => (
          <button key={i} className={twMerge('w-8', style && 'mt-auto')} onClick={handleClick(i)}>
            {svgIcon}
          </button>
        ))}
      </div>

      <Panel
        collapsible={true}
        minSize={minSizeRef.current}
        defaultSize={minSizeRef.current}
        ref={panelRef}
        order={0}
      >
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
