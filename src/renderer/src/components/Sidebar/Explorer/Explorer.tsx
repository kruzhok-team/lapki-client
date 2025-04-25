import React, { useReducer, useRef, RefObject, useState } from 'react';

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { useModelContext } from '@renderer/store/ModelContext';

import { StateMachineComponentList } from './StateMachineComponentList';
import { StateMachinesHierarchy } from './StateMachinesHierarchy';

import { StateMachinesList } from '../StateMachinesTab';

const collapsedSize = 6;

export const Explorer: React.FC = () => {
  const modelController = useModelContext();
  const isInitialized = modelController.model.useData('', 'isInitialized');
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const stateMachinesIds = Object.keys(
    modelController.controllers[headControllerId].useData('stateMachinesSub')
  );

  const stateMachinesPanelRef = useRef<ImperativePanelHandle>(null);
  const componentPanelRef = useRef<ImperativePanelHandle>(null);
  const hierarchyPanelRef = useRef<ImperativePanelHandle>(null);

  const [, forceUpdate] = useReducer((p) => p + 1, 0);

  const [selectedSm, setSmSelected] = useState<string | null>(null);

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
      <h3 className="mx-4 border-b border-border-primary py-2 text-center text-lg">Диаграмма</h3>
      <PanelGroup direction="vertical">
        <Panel
          ref={stateMachinesPanelRef}
          id="panel0"
          collapsible
          minSize={collapsedSize}
          collapsedSize={collapsedSize}
          onCollapse={forceUpdate}
          onExpand={forceUpdate}
          className="px-4"
        >
          <StateMachinesList
            selectedSm={selectedSm}
            setSmSelected={setSmSelected}
            isCollapsed={() => stateMachinesPanelRef.current?.isCollapsed() ?? false}
            togglePanel={() => togglePanel(stateMachinesPanelRef)}
          />
        </Panel>

        <PanelResizeHandle className="group relative py-1">
          <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-border-primary transition-colors group-hover:h-1 group-hover:bg-primary group-active:h-1 group-active:bg-primary"></div>
        </PanelResizeHandle>

        <Panel
          ref={componentPanelRef}
          id="panel1"
          collapsible
          minSize={collapsedSize}
          collapsedSize={collapsedSize}
          onCollapse={forceUpdate}
          onExpand={forceUpdate}
          className="px-4"
        >
          <StateMachineComponentList
            smId={stateMachinesIds.length > 0 ? stateMachinesIds[0] : ''}
            isCollapsed={() => componentPanelRef.current?.isCollapsed() ?? false}
            togglePanel={() => togglePanel(componentPanelRef)}
          />
        </Panel>

        <PanelResizeHandle className="group relative py-1">
          <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-border-primary transition-colors group-hover:h-1 group-hover:bg-primary group-active:h-1 group-active:bg-primary"></div>
        </PanelResizeHandle>

        <Panel
          id="panel2"
          ref={hierarchyPanelRef}
          collapsible
          minSize={collapsedSize}
          collapsedSize={collapsedSize}
          onCollapse={forceUpdate}
          onExpand={forceUpdate}
          className="px-4"
        >
          <div
            className={
              hierarchyPanelRef.current?.isCollapsed() ?? false
                ? ''
                : 'max-h-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb'
            }
          >
            <button
              className="my-3 flex items-center"
              onClick={() => togglePanel(hierarchyPanelRef)}
            >
              <ArrowIcon
                className={twMerge(
                  'rotate-0 transition-transform',
                  hierarchyPanelRef.current?.isCollapsed() && '-rotate-90'
                )}
              />
              <h3 className="font-semibold">Иерархия</h3>
            </button>

            {isInitialized ? (
              <StateMachinesHierarchy />
            ) : (
              <div className="px-4">Недоступно до открытия документа</div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </section>
  );
};
