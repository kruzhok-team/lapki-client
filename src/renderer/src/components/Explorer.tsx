import React from 'react';

export const Explorer: React.FC = () => {
  return (
    <section className="flex flex-col items-center bg-[#4391BF] bg-opacity-50 font-Fira text-[1rem]">
      <div className="h-[50vh] w-full bg-[#FFFFFF] bg-opacity-50 text-center">
        <p className="my-[1vw]">Проводник</p>
        <hr className="mx-[2rem] h-[1px] w-[10rem] border-none bg-[#FFFFFF]" />
        <aside className="border-r p-4">
          <button className="mb-4 rounded-sm bg-white px-2 py-1 text-neutral-800">
            Компоненты
          </button>
          <div
            className="m-auto grid h-[3vw] w-[8rem] place-items-center bg-neutral-700 text-neutral-50"
            draggable
          >
            Состояние
          </div>
        </aside>
      </div>
      <div className="h-[50vh] bg-[#4391BF] bg-opacity-50 text-center">
        <p className="my-[1vw]">Иерархия состояний</p>
        <hr className="mx-[2rem] h-[1px] w-[10rem] border-none bg-[#FFFFFF]" />
      </div>
    </section>
  );
};
