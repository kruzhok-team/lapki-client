import { useState } from "react";
/*Загрузка документации*/
import { Docs } from "../file/Doc";

export function Documentations() {

    const [activeIndex, setActiveIndex] = useState(1);
    const handleClick = (index) => setActiveIndex(index);
    const checkActive = (index, className) => activeIndex === index ? className : "";
    return (

        <section className="flex flex-col font-Fira select-none text-[calc(4.5vh/2)] w-[22vw] h-[100vh] mt-auto">
            <div className="flex flex-row bg-[#4391BF] h-[5vh]">
                <button className={`w-[50vw] bg-[#FFFFFF] ${checkActive(1, "bg-[#4391BF] bg-opacity-50")}`} onClick={() => handleClick(1)}>
                Руководство
                </button>
                <button className={`w-[50vw] bg-[#FFFFFF] ${checkActive(2, "bg-[#4391BF] bg-opacity-50")}`} onClick={() => handleClick(2)}>
                Справка
                </button>
            </div>
 
            <div className="flex flex-col bg-[#4391BF] bg-opacity-50 w-[22vw] h-[95vh]">
                <div className="w-[22vw] h-[6vh]">
                    <input type="text" placeholder=" Поиск" className="w-[18vw] h-[4vh] bg-[#FFFFFF] bg-opacity-50 ml-[2vw] mt-[1vh] hover:border-[1px] hover:border-[#FFFFFF]"></input>
                </div>
                <div className="bg-[#FFFFFF] bg-opacity-50 w-[22vw] h-[89vh] mt-auto">
                    <div className={`text-justify scrollbar-none overflow-y-scroll overflow-x-hidden w-[22vw] h-[89vh] mt-auto hidden ${checkActive(1, "!block")}`}>
                        <Docs />
                    </div>
                    <div className={`mx-[1vw] hidden ${checkActive(2, "!block")}`}>
                        <a className="text-[#4391BF]" download='State Machine.pdf' href="../file/AN_Crash_Course_in_UML_State_Machines.pdf">1. Application Note A Crash Course in UML State Machines</a>
                        <hr className="bg-[#4391BF] w-[20vw] border-none h-[1px]"/>
                        <p>Материал на английском языке, так что будьте готовы изучить не только что такое "машина состояний" Хы-Хы:D.</p>
                        <br/>
                        <a className="text-[#4391BF]" download='State Machine 2.pdf' href='../file/PSiCC2.pdf'>2. PRACTICAL UML STATEHARTS in C/C++</a>
                        <hr className="bg-[#4391BF] w-[20vw] border-none h-[1px]"/>
                        <p>Материал тоже на английском, так что сорян, с кем не бывает, но зато есть шанс прокачать свои навыки,  хи-хи-хи.</p>

                        <a>u</a>
                        <p></p>

                        <a>u</a>
                        <p></p>

                        <a>u</a>
                        <p></p>

                        <a>u</a>
                        <p></p>
                    </div>
                </div>
            </div>
        </section>
    );
}