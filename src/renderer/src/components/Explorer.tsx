import { StateMachine } from '@renderer/lib/data/StateMachine';
import React from 'react';

interface ExplorerProps {
  stateMachine: StateMachine | undefined;
}

export const Explorer: React.FC<ExplorerProps> = ({ stateMachine }) => {
  console.log(stateMachine);
  return (
    <section className="flex h-full flex-col justify-between bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Проводник</h1>

        <h2 className="mb-4 ">Компоненты</h2>
        {stateMachine && (
          <div>
            {[...stateMachine.components.keys()].map((key) => (
              <div key={'explorer' + key}>
                <img src={stateMachine.components.get(key)?.image.src}></img> {key}
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
