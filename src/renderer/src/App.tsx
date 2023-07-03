import React, { useState } from 'react';
import { CodeEditor, DiagramEditor, Explorer, Documentations, Menu, Tabs } from './components';
import { Elements } from './types/diagram';

/*Первые иконки*/
import menu from './img/menu.png';
import components from './img/components.png';
import programming1 from './img/programming1.png';
import drive from './img/flash-drive.png';
import chip from './img/chip.png';
import gear from './img/gear.png';
import arrow from './img/arrow.png';
import forward from './img/forward.png';
/*Вторичные иконки*/
import components1 from './img/components1.png';
import programming from './img/programming.png';
import drive1 from './img/flash-drive1.png';
import chip1 from './img/chip1.png';
import gear1 from './img/gear1.png';
import arrow1 from './img/arrow1.png';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;

  /*Переключение блоков в меню между собой*/
  const [activeIndex, setActiveIndex] = useState(0);
  const handleClick = (index) => setActiveIndex(index);
  const checkActive = (index, className) => (activeIndex === index ? className : '');

  /*Переключение блоков в меню между собой*/
  const [activeIndexDoc, setActiveIndexDoc] = useState(0);
  const handleClickDoc = (index) => setActiveIndexDoc(index);
  const checkActiveDoc = (index, className) => (activeIndexDoc === index ? className : '');

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
      <section className="flex h-screen w-[4vw] flex-col items-center bg-transparent">
        <button
          className={`h-[4.5vw] w-[4vw] ${checkActive(1, '!bg-[#4391BF] !bg-opacity-50')}`}
          onClick={() => (activeIndex === 1 ? handleClick(0) : handleClick(1))}
        >
          <img src={menu} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
        </button>
        <hr className="h-[1px] w-[4vw] border-none bg-[#4391BF]" />
        <button
          className={`h-[4.5vw] w-[4vw] ${checkActive(2, '!bg-[#4391BF] !bg-opacity-50')}`}
          onClick={() => (activeIndex === 2 ? handleClick(0) : handleClick(2), handleOpenFile())}
        >
          <img
            src={activeIndex == 2 ? components1 : components}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
        <button
          className={`h-[4.5vw] w-[4vw] ${checkActive(3, '!bg-[#4391BF] !bg-opacity-50')}`}
          onClick={() => (
            activeIndex === 3 ? handleClick(0) : handleClick(3), handleToggleCodeEditor()
          )}
        >
          <img
            src={activeIndex == 3 ? programming : programming1}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
        <button
          className={`h-[4.5vw] w-[4vw] ${checkActive(4, '!bg-[#4391BF] !bg-opacity-50')}`}
          onClick={() => (activeIndex === 4 ? handleClick(0) : handleClick(4))}
        >
          <img
            src={activeIndex == 4 ? drive1 : drive}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
        <button
          className={`h-[4.5vw] w-[4vw] ${checkActive(5, '!bg-[#4391BF] !bg-opacity-50')}`}
          onClick={() => (activeIndex === 5 ? handleClick(0) : handleClick(5))}
        >
          <img
            src={activeIndex == 5 ? chip1 : chip}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
        <button
          className={`mt-auto h-[4.5vw] w-[4vw] ${checkActive(6, '!bg-[#4391BF] !bg-opacity-50')}`}
          onClick={() => (activeIndex === 6 ? handleClick(0) : handleClick(6))}
        >
          <img
            src={activeIndex == 6 ? gear1 : gear}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
      </section>
      <div className={`hidden ${checkActive(1, '!block')}`}>
        <Menu />
      </div>
      <div className={`hidden ${checkActive(2, '!block')}`}>
        <Explorer />
      </div>
      <div className={`hidden ${checkActive(3, '!block')}`}>
        {isCodeEditorOpen && fileContent && <CodeEditor value={fileContent} />}
      </div>
      <div className={`flex h-[95vh] w-[92vw] flex-col`}>
        <div className={`flex h-[5vh] flex-row items-center`}>
          <div className={`flex-1`}>{elements && <Tabs />}</div>
          <button className={`h-[4.5vw] w-[4vw]`}>
            <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
          </button>
        </div>
        <main
          className={`flex h-[95vh] items-center ${
            activeIndex === 0
              ? activeIndexDoc === 0
                ? `w-[92vw]`
                : `w-[70vw]`
              : activeIndexDoc === 0
              ? `w-[76vw]`
              : `w-[54vw]`
          }`}
        >
          {elements ? (
            <DiagramEditor elements={elements} />
          ) : (
            <div className="w-[92vw] text-center font-Fira text-[1rem]">
              Откройте файл или перенесите его сюда...
            </div>
          )}
        </main>
      </div>

      <section className="flex h-screen w-[4vw] items-center bg-transparent">
        <button
          className={`h-[4.5vw] w-[4vw]`}
          onClick={activeIndexDoc === 7 ? () => handleClickDoc(0) : () => handleClickDoc(7)}
        >
          <img
            src={activeIndexDoc == 7 ? arrow1 : arrow}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
      </section>
      <div className={`hidden transition-all ${checkActiveDoc(7, '!block')}`}>
        <Documentations />
      </div>
    </div>
  );
};
