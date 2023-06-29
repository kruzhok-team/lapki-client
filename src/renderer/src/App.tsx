import React, { useState } from 'react';
import { CodeEditor, DiagramEditor, Explorer, Documentations, Menu } from './components';
import { Elements } from './types/diagram';

/*Первые иконки*/
import menu from './img/menu.png';
import components from './img/components.png';
import programming1 from './img/programming1.png';
import drive from './img/flash-drive.png';
import chip from './img/chip.png';
import gear from './img/gear.png';
/*Вторичные иконки*/
import components1 from './img/components1.png';
import programming from './img/programming.png';
import drive1 from './img/flash-drive1.png';
import chip1 from './img/chip1.png';
import gear1 from './img/gear1.png';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;

  /*Переключение блоков в меню между собой*/
  const [activeIndex, setActiveIndex] = useState(1);
  const handleClick = (index) => setActiveIndex(index);
  const checkActive = (index, className) => activeIndex === index ? className : "";

  /*Открытие файла*/
  const handleOpenFile = async () => {
    const fileContent = await window.electron.ipcRenderer.invoke('dialog:openFile');
  
    if (fileContent && typeof fileContent === 'string') {
      setFileContent(fileContent);
    }
  };

  /*Вывод сообщения перед открытием редактора кода*/
  const handleToggleCodeEditor = () => {
    if (!fileContent) {
      return alert('Сначала откройте файл JSON');
    }

    setIsCodeEditorOpen((p) => !p);
  };
  return (

    <div className="flex flex-row">
      <section className="flex flex-col items-center h-screen bg-white w-[4vw]"> 
        <button className={`w-[4vw] h-[4.5vw] ${checkActive(1, "!bg-opacity-50 !bg-[#4391BF]")}`} onClick={() => (handleClick(1))}>
          <img src={menu} alt="" className="w-[2.5vw] h-[2.5vw] m-auto"></img>
        </button>
        <hr className="bg-[#4391BF] w-[4vw] border-none h-[1px]"/>
        <button className={`w-[4vw] h-[4.5vw] ${checkActive(2, "!bg-opacity-50 !bg-[#4391BF]")}`} onClick={() => (handleClick(2), handleOpenFile())}>
          <img src={activeIndex==2 ? components1 : components} alt="" className="w-[2.5vw] h-[2.5vw] m-auto"></img>
        </button>
        <button className={`w-[4vw] h-[4.5vw] ${checkActive(3, "!bg-opacity-50 !bg-[#4391BF]")}`} onClick={() => (handleClick(3), handleToggleCodeEditor())}>
          <img src={activeIndex==3 ? programming : programming1} alt="" className="w-[2.5vw] h-[2.5vw] m-auto"></img>
        </button>
        <button className={`w-[4vw] h-[4.5vw] ${checkActive(4, "!bg-opacity-50 !bg-[#4391BF]")}`} onClick={() => (handleClick(4))}>
          <img src={activeIndex==4 ? drive1 : drive} alt="" className="w-[2.5vw] h-[2.5vw] m-auto"></img>
        </button>
        <button className={`w-[4vw] h-[4.5vw] ${checkActive(5, "!bg-opacity-50 !bg-[#4391BF]")}`} onClick={() => (handleClick(5))}>
          <img src={activeIndex==5 ? chip1 : chip} alt="" className="w-[2.5vw] h-[2.5vw] m-auto"></img>
        </button>
        <button className={`w-[4vw] h-[4.5vw] mt-auto ${checkActive(6, "!bg-opacity-50 !bg-[#4391BF]")}`} onClick={() => (handleClick(6))}>
          <img src={activeIndex==6 ? gear1 : gear} alt="" className="w-[2.5vw] h-[2.5vw] m-auto"></img>
        </button>
      </section>
      <div className={`hidden ${checkActive(1, "!block")}`}>
        <Menu />
      </div>
      <div className={`hidden ${checkActive(2, "!block")}`}>
        <Explorer />
      </div>
      <div className={`hidden ${checkActive(3, "!block")}`}>
        {isCodeEditorOpen && fileContent && <CodeEditor value={fileContent} />}
      </div>
      
      <main className={`flex items-center justify-center h-screen ${isCodeEditorOpen ? `w-[58vw]` : activeIndex!=3 ? `w-[58vw]` : `w-[74vw]`}`}>
        {elements ? (<DiagramEditor elements={elements} />) : (<div className="font-Fira text-[calc(5vh/2)]">Откройте файл или перенесите его сюда...</div>)}
      </main>
      <Documentations />
    </div>
  );
};
