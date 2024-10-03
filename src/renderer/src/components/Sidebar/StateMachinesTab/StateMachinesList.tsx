// import React, { useState } from 'react';

// import { StateMachineEditModal } from '@renderer/components/StateMachineEditModal';
// import { useStateMachines } from '@renderer/hooks';
// import { useModelContext } from '@renderer/store/ModelContext';

// import { Component } from '../Explorer/Component';

// export const StateMachinesList: React.FC = () => {
//   const modelController = useModelContext();

//   const editor = modelController.getCurrentCanvas();
//   const isInitialized = modelController.model.useData('', 'canvas.isInitialized', editor.id);
//   const elements = modelController.model.useData('', 'elements.stateMachines');
//   console.log(elements);
//   const [selectedSm, setSmSelected] = useState<string | null>(null);
//   const {
//     addProps,
//     editProps,
//     deleteProps,
//     // onSwapStateMachines
//     onRequestAddStateMachine,
//     onRequestEditStateMachine,
//     onRequestDeleteStateMachine,
//   } = useStateMachines();

//   const button = [
//     {
//       name: 'Добавить машину состояний',
//       handler: onRequestAddStateMachine,
//       disabled: !isInitialized,
//     },
//   ];

//   return (
//     <section>
//       <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
//         Машины состояний
//       </h3>
//       <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
//         {[...Object.entries(elements)].map(([id, sm]) => (
//           <Component
//             key={id}
//             name={sm.name || id}
//             icon={undefined}
//             description={undefined}
//             isSelected={(sm.name || id) === selectedSm}
//             onSelect={() => setSmSelected(sm.name || id)}
//             onEdit={() => onRequestEditStateMachine(id, id)}
//             onDelete={() => onRequestDeleteStateMachine(id)}
//             // TODO: Доделать свап машин состояний
//             onDragStart={() => console.log('setDragState')}
//             onDrop={() => console.log('onDrop')}
//             isDragging={id === ''}
//           />
//         ))}
//       </div>
//       <div className="flex flex-col px-4">
//         {button.map(({ name, handler, disabled }, i) => (
//           <button key={i} className="btn-primary mb-2" onClick={handler} disabled={disabled}>
//             {name}
//           </button>
//         ))}
//       </div>
//       <StateMachineEditModal {...editProps} />
//     </section>
//   );
// };
