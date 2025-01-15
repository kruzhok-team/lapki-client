import React, { useReducer, useRef, RefObject } from 'react';

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { useModelContext } from '@renderer/store/ModelContext';

import { ComponentsList } from './ComponentsList';
import { StateMachinesHierarchy } from './StateMachinesHierarchy';

export const Explorer: React.FC = () => {
  const modelController = useModelContext();
  const isInitialized = modelController.model.useData('', 'isInitialized');

  const componentPanelRef = useRef<ImperativePanelHandle>(null);
  const hierarchyPanelRef = useRef<ImperativePanelHandle>(null);
  const [, forceUpdate] = useReducer((p) => p + 1, 0);

  const togglePanel = (panelRef: RefObject<ImperativePanelHandle>) => {
    const panel = panelRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }

    forceUpdate();
  };

  return (
    <section className="flex h-full flex-col">
      <h3 className="mx-4 border-b border-border-primary py-2 text-center text-lg">Проводник</h3>
      <PanelGroup direction="vertical">
        <Panel
          ref={componentPanelRef}
          id="panel1"
          collapsible
          defaultSize={50}
          minSize={3}
          collapsedSize={3}
          onCollapse={forceUpdate}
          onExpand={forceUpdate}
          className="px-4"
        >
          <button className="my-3 flex items-center" onClick={() => togglePanel(componentPanelRef)}>
            <ArrowIcon
              className={twMerge(
                'rotate-0 transition-transform',
                componentPanelRef.current?.isCollapsed() && '-rotate-90'
              )}
            />
            <h3 className="font-semibold">Компоненты</h3>
          </button>

          {isInitialized ? <ComponentsList /> : 'Недоступно до открытия схемы'}
        </Panel>

        <PanelResizeHandle className="group relative py-1">
          <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-border-primary transition-colors group-hover:h-1 group-hover:bg-primary group-active:h-1 group-active:bg-primary"></div>
        </PanelResizeHandle>

        <Panel
          id="panel2"
          ref={hierarchyPanelRef}
          collapsible
          minSize={3}
          collapsedSize={3}
          onCollapse={forceUpdate}
          onExpand={forceUpdate}
          className="px-4"
        >
          <button className="my-3 flex items-center" onClick={() => togglePanel(hierarchyPanelRef)}>
            <ArrowIcon
              className={twMerge(
                'rotate-0 transition-transform',
                hierarchyPanelRef.current?.isCollapsed() && '-rotate-90'
              )}
            />
            <h3 className="font-semibold">Структура</h3>
          </button>

          {isInitialized ? <StateMachinesHierarchy /> : 'Недоступно до открытия схемы'}
        </Panel>
      </PanelGroup>
    </section>
  );
};
