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
                    <div className={`hidden ${checkActive(2, "!block")}`}>
                        <p>Тут увы пока не ахти, готов буду исправить!</p>
                    </div>
                </div>
            </div>
        </section>
    );
}