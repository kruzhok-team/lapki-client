import { useState } from 'react';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
export function Explorer() {
    const [editor] = useState<CanvasEditor | null>(null);
    return (
        <section className="flex flex-col font-Fira items-center bg-[#4391BF] bg-opacity-50 w-[16vw]">
            <div className=" h-[50vh] bg-[#FFFFFF] bg-opacity-50 w-[16vw] text-center">
                <p className="my-[1vw] text-[calc(4.5vh/2)]">
                    Проводник
                </p>
                <hr className="bg-[#4391BF] mx-[2vw] w-[12vw] border-none h-[1px]"/>
                <aside className="h-[50vh] border-r p-4">
                    <button className="mb-4 rounded-sm bg-neutral-50 px-2 py-1 text-neutral-800" onClick={() => console.log(editor?.container.graphData)}>
                    Компоненты
                    </button>
                    <div className="grid h-[3vw] w-[8vw] place-items-center bg-neutral-700 text-neutral-50" draggable>
                    Состояние
                    </div>
                </aside>
            </div>
            <div className="h-[50vh] w-[16vw] bg-[#FFFFFF] bg-opacity-50">

            </div>
        </section>
    );
}