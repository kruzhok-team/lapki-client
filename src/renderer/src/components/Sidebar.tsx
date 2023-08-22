import React, { useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';
import { Resizable } from 're-resizable';

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

import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as DriveIcon } from '@renderer/assets/icons/drive.svg';
//import { ReactComponent as ChipIcon } from '@renderer/assets/icons/chip.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { Setting } from './Setting';
import { EditorRef } from './utils/useEditorManager';

export interface SidebarCallbacks {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestAddComponent: () => void;
  onRequestEditComponent: (idx: string) => void;
  onRequestImport: (platform: string) => void;
  onRequestDeleteComponent: (name: string) => void;
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
    onRequestEditComponent,
    onRequestDeleteComponent,
    onRequestImport,
  },
}) => {
  const [sidebarTabActive, setSidebarTabActive] = useState(0);
  const [width, setWidth] = React.useState(250);
  const [minWidth, setMinWidth] = React.useState(200);
  const [maxWidth, setMaxWidth] = React.useState('80vw');
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleClick = (i: number) => () => {
    if (i === sidebarTabActive) {
      isCollapsed ? setIsCollapsed(false) : setIsCollapsed(true);
    } else {
      setSidebarTabActive(i);
      isCollapsed ? setIsCollapsed(false) : null;
    }
  };

  const items = useMemo(
    () => [
      {
        svgIcon: (
          <div className="relative">
            <MenuIcon />
            {editorRef.editorData.modified && (
              <div className="absolute right-0 top-0 aspect-square h-2 w-2" />
            )}
          </div>
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
    onRequestImport,
    compilerStatus: compilerProps.compilerStatus,
  };

  const explorerCallbacks: ExplorerCallbacks = {
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
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

  React.useEffect(() => {
    if (isCollapsed) {
      setMaxWidth('5px');
      setMinWidth(5);
    } else {
      setMaxWidth('80vw');
      setMinWidth(200);
    }
  }, [isCollapsed]);

  const handleResize = (e) => {
    e.pageX < 100 ? setIsCollapsed(true) : setIsCollapsed(false);
  };

  const handleResizeStop = (d) => {
    setWidth(width + d.width);
  };

  return (
    <>
      <div className="flex flex-col border-r border-border-primary bg-bg-primary">
        {items.map(({ svgIcon, style }, i) => (
          <button
            key={i}
            className={twMerge(
              'w-12 border-l-2 border-transparent p-2 text-text-inactive transition-colors hover:text-text-primary',
              i === sidebarTabActive && 'border-primary text-text-primary',
              style && 'mt-auto'
            )}
            onClick={handleClick(i)}
          >
            {svgIcon}
          </button>
        ))}
      </div>

      <Resizable
        enable={{ right: true }}
        size={{ width: width, height: '100vh' }}
        minWidth={minWidth}
        maxWidth={maxWidth}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        className="flex items-center justify-center overflow-hidden bg-bg-secondary"
      >
        <div className="h-full w-full">
          {tabs.map((Element, i) => (
            <div
              key={i}
              className={twMerge(
                'hidden h-full border-r border-border-primary',
                i === sidebarTabActive && 'block'
              )}
            >
              {Element}
            </div>
          ))}
        </div>
      </Resizable>

      {/* <PanelResizeHandle className="group">
        <div className="h-full w-1 bg-[#4391BF] bg-opacity-50 transition-colors group-hover:bg-opacity-100 group-data-[resize-handle-active]:bg-opacity-100" />
      </PanelResizeHandle> */}
    </>
  );
};
