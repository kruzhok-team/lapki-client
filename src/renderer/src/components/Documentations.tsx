import { useState } from 'react';
/*Загрузка документации*/
import { Docs } from '../file/Doc';

export function Documentations() {
  const [activeIndex, setActiveIndex] = useState(1);
  const handleClick = (index) => setActiveIndex(index);
  const checkActive = (index, className) => (activeIndex === index ? className : '');
  return (
    <section className="mt-auto flex h-[100vh] w-[22vw] select-none flex-col font-Fira text-[1rem]">
      <div className="flex h-[5vh] flex-row bg-[#4391BF]">
        <button
          className={`w-[50vw] bg-[#FFFFFF] ${checkActive(1, 'bg-[#4391BF] bg-opacity-50')}`}
          onClick={() => handleClick(1)}
        >
          Руководство
        </button>
        <button
          className={`w-[50vw] bg-[#FFFFFF] ${checkActive(2, 'bg-[#4391BF] bg-opacity-50')}`}
          onClick={() => handleClick(2)}
        >
          Справка
        </button>
      </div>

      <div className="flex h-[95vh] w-[22vw] flex-col bg-[#4391BF] bg-opacity-50">
        <div className="h-[6vh] w-[22vw]">
          <input
            type="text"
            placeholder=" Поиск"
            className="ml-[2vw] mt-[1vh] h-[4vh] w-[18vw] bg-[#FFFFFF] bg-opacity-50 hover:border-[1px] hover:border-[#FFFFFF]"
          ></input>
        </div>
        <div className="mt-auto h-[89vh] w-[22vw] bg-[#FFFFFF] bg-opacity-50">
          <div
            className={`mt-auto hidden h-[89vh] w-[22vw] overflow-x-hidden overflow-y-scroll text-justify scrollbar-none ${checkActive(
              1,
              '!block'
            )}`}
          >
            <Docs />
          </div>
          <div className={`mx-[1vw] hidden ${checkActive(2, '!block')}`}>
            <a
              className="text-[#4391BF]"
              download="State Machine.pdf"
              href="../file/AN_Crash_Course_in_UML_State_Machines.pdf"
            >
              1. Application Note A Crash Course in UML State Machines
            </a>
            <hr className="h-[1px] w-[20vw] border-none bg-[#4391BF]" />
            <p>
              Материал на английском языке, так что будьте готовы изучить не только что такое
              "машина состояний" Хы-Хы:D.
            </p>
            <br />
            <a className="text-[#4391BF]" download="State Machine 2.pdf" href="../file/PSiCC2.pdf">
              2. PRACTICAL UML STATEHARTS in C/C++
            </a>
            <hr className="h-[1px] w-[20vw] border-none bg-[#4391BF]" />
            <p>
              Материал тоже на английском, так что сорян, с кем не бывает, но зато есть шанс
              прокачать свои навыки, хи-хи-хи.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
