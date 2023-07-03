import React from 'react';

interface ExplorerProps {}

export const Explorer: React.FC<ExplorerProps> = () => {
  return (
    <section className="flex w-full flex-col items-center bg-[#4391BF] bg-opacity-50 font-Fira text-[1rem]">
      <div className="h-[50vh] bg-[#FFFFFF] bg-opacity-50 text-center">
        <p className="my-[1vw]">Проводник</p>
        <hr className="mx-[2vw] h-[1px] w-[12vw] border-none bg-[#4391BF]" />
        <aside className="h-[50vh] border-r p-4">
          <button
            className="mb-4 rounded-sm bg-neutral-50 px-2 py-1 text-neutral-800"
            onClick={() => console.log('12')}
          >
            Компоненты
          </button>
          <div
            className="grid h-[3vw] w-[8vw] place-items-center bg-neutral-700 text-neutral-50"
            draggable
          >
            Состояние
          </div>
        </aside>
      </div>
      <div className="h-[50vh] border-t-[0.15rem] border-dashed border-[#4391BF] bg-[#FFFFFF] bg-opacity-50"></div>
    </section>
  );
};
