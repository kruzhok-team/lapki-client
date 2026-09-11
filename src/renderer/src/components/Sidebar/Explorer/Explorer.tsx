import React, { useReducer, useRef, RefObject, useState } from 'react';

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels';

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
  ).filter(Boolean);

  const stateMachinesPanelRef = useRef<ImperativePanelHandle>(null);
  const componentPanelRef = useRef<ImperativePanelHandle>(null);
  const hierarchyPanelRef = useRef<ImperativePanelHandle>(null);

  const [, forceUpdate] = useReducer((p) => p + 1, 0);

  const [selectedSm, setSmSelected] = useState<string | null>(null);
  const activeSm = stateMachinesIds[0];
  const displayedSm =
    selectedSm && stateMachinesIds.includes(selectedSm) ? selectedSm : stateMachinesIds[0];

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
    <section className="flex h-full min-h-0 flex-col">
      {!isInitialized ? (
        <div className="p-4 text-text-inactive">
          <em>Недоступно до открытия документа</em>
        </div>
      ) : (
        <PanelGroup direction="vertical" className="min-h-0 flex-1">
          <Panel
            ref={stateMachinesPanelRef}
            id="panel0"
            collapsible
            minSize={collapsedSize}
            collapsedSize={collapsedSize}
            defaultSize={25.5}
            onCollapse={forceUpdate}
            onExpand={forceUpdate}
            className="min-h-0 overflow-hidden px-[12px]"
          >
            <StateMachinesList
              activeSm={activeSm ?? null}
              selectedSm={selectedSm}
              setSmSelected={setSmSelected}
              isCollapsed={() => stateMachinesPanelRef.current?.isCollapsed() ?? false}
              togglePanel={() => togglePanel(stateMachinesPanelRef)}
            />
          </Panel>

          <PanelResizeHandle className="group relative h-px shrink-0">
            <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-border-primary transition-colors group-hover:h-1 group-hover:bg-primary group-active:h-1 group-active:bg-primary [[data-theme=light]_&]:bg-[#eeeeee]"></div>
          </PanelResizeHandle>

          <Panel
            ref={componentPanelRef}
            id="panel1"
            collapsible
            minSize={collapsedSize}
            collapsedSize={collapsedSize}
            defaultSize={38.2}
            onCollapse={forceUpdate}
            onExpand={forceUpdate}
            className="min-h-0 overflow-hidden px-[12px]"
          >
            <StateMachineComponentList
              smId={displayedSm ?? ''}
              isCollapsed={() => componentPanelRef.current?.isCollapsed() ?? false}
              togglePanel={() => togglePanel(componentPanelRef)}
            />
          </Panel>

          <PanelResizeHandle className="group relative h-px shrink-0">
            <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-border-primary transition-colors group-hover:h-1 group-hover:bg-primary group-active:h-1 group-active:bg-primary [[data-theme=light]_&]:bg-[#eeeeee]"></div>
          </PanelResizeHandle>

          <Panel
            id="panel2"
            ref={hierarchyPanelRef}
            collapsible
            minSize={collapsedSize}
            collapsedSize={collapsedSize}
            defaultSize={36.3}
            onCollapse={forceUpdate}
            onExpand={forceUpdate}
            className="min-h-0 overflow-hidden px-[12px]"
          >
            {isInitialized ? (
              <StateMachinesHierarchy
                isCollapsed={() => hierarchyPanelRef.current?.isCollapsed() ?? false}
                togglePanel={() => togglePanel(hierarchyPanelRef)}
              />
            ) : (
              <div className="px-4">Недоступно до открытия документа</div>
            )}
          </Panel>
        </PanelGroup>
      )}
    </section>
  );
};
