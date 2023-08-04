import React from 'react';

import { StateMachine } from '@renderer/lib/data/StateMachine';

interface ExplorerProps {
  stateMachine: StateMachine | undefined;
}

export const Explorer: React.FC<ExplorerProps> = ({ stateMachine }) => {
  return (
    <section className="flex h-full flex-col justify-between bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компоненты</h1>
        {stateMachine && (
          <div className="flex flex-col items-center">
            {[...stateMachine.components.keys()].map((key) => (
              <div className="mb-4 h-20 w-20" key={'explorer' + key}>
                <img src={stateMachine.components.get(key)?.image?.src}></img>
                {key}
              </div>
            ))}
          </div>
        )}
        <div className="cursor-pointer rounded bg-neutral-700 px-4 py-3 text-neutral-50" draggable>
          Состояние
        </div>
      </div>

      <div className="h-[500px] px-4 text-center">
        <h1 className="mb-3 border-b border-white  pb-2 text-lg">Иерархия состояний</h1>

        <div>
          Не забыть посмотреть варианты древа и возможности редактирования машины состояний
          отсюда!!!
        </div>
      </div>
    </section>
  );
};
