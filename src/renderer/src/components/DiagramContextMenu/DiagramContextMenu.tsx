import React from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

import { SchemeScreenContextMenu } from './SchemeScreenContextMenu';
import { StateMachineContextMenu } from './StateMachineContextMenu';

export const DiagramContextMenu: React.FC = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const stateMachines = Object.keys(controller.stateMachinesSub);

  switch (controller.type) {
    case 'specific':
      return <StateMachineContextMenu smId={stateMachines[0]} controller={controller} />;
    case 'scheme':
      return <SchemeScreenContextMenu />;
    default:
      break;
  }

  return;
};
