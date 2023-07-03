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
import { twMerge } from 'tailwind-merge';

const sidebar = [
  {
    imgSrc: menu,
  },
  {
    imgSrc: components1,
  },
  {
    imgSrc: programming,
  },
  {
    imgSrc: drive1,
  },
  {
    imgSrc: chip1,
  },
  {
    imgSrc: gear1,
  },
];

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;

  /*Переключение блоков в меню между собой*/
  const [activeIndex, setActiveIndex] = useState(0);
  const handleClick = (index: number) => () => setActiveIndex(index);
  const isActive = (index: number) => activeIndex === index;

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
        {sidebar.map(({ imgSrc }, index) => (
          <button
            className={twMerge(
              'h-[4.5vw] w-[4vw]',
              isActive(index) && '!bg-[#4391BF] !bg-opacity-50'
            )}
            onClick={handleClick(index)}
          >
            <img src={imgSrc} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
          </button>
        ))}
      </section>

      <div className={twMerge('hidden', isActive(1) && 'block')}>
        <Menu />
      </div>
      <div className={twMerge('hidden', isActive(2) && 'block')}>
        <Explorer />
      </div>
      <div className={twMerge('hidden', isActive(3) && 'block')}>
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
