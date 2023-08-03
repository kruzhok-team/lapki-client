import { useState } from 'react';

/*Загрузка документации*/
import { twMerge } from 'tailwind-merge';

import { Docs } from '../assets/file/Docs';

export function Documentations() {
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <section className="flex h-full select-none flex-col border-l-[1px] border-[#4391BF] bg-white p-4 font-Fira text-base">
      <div className="flex gap-1 py-2">
        <button
          className={twMerge(
            'w-1/2 border border-[#4391BF] p-2',
            activeTab === 0 && 'bg-[#4391BF] bg-opacity-50'
          )}
          onClick={() => setActiveTab(0)}
        >
          Руководство
        </button>
        <button
          className={twMerge(
            'w-1/2 border border-[#4391BF] p-2',
            activeTab === 1 && 'bg-[#4391BF] bg-opacity-50'
          )}
          onClick={() => setActiveTab(1)}
        >
          Справка
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск"
        className="mb-2 border border-[#4391BF] px-4 py-2 outline-none"
      />

      <div className="h-full overflow-y-auto bg-[#4391BF] bg-opacity-50 p-4">
        <div className={twMerge(activeTab !== 0 && 'hidden')}>
          <Docs />
        </div>

        <div className={twMerge(activeTab !== 1 && 'hidden')}>
          <a
            className="text-[#4391BF]"
            download="State Machine.pdf"
            href="../file/AN_Crash_Course_in_UML_State_Machines.pdf"
          >
            1. Application Note A Crash Course in UML State Machines
          </a>
          <hr className="h-[1px] border-none bg-[#4391BF]" />
          <p>
            Материал на английском языке, так что будьте готовы изучить не только что такое "машина
            состояний" Хы-Хы:D.
          </p>
          <br />
          <a className="text-[#4391BF]" download="State Machine 2.pdf" href="../file/PSiCC2.pdf">
            2. PRACTICAL UML STATEHARTS in C/C++
          </a>
          <hr className="h-[1px] border-none bg-[#4391BF]" />
          <p>Материал тоже на английском, так что сорян, с кем не бывает, хи-хи-хи.</p>
        </div>
      </div>
    </section>
  );
}
