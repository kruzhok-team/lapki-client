import { Dispatch } from 'react';

import html2canvas from 'html2canvas';

import { Compiler } from '@renderer/components/Modules/Compiler';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import { Elements, emptyElements } from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';
import { TemplatesList } from '@renderer/types/templates';

import { EditorModel } from './EditorModel';

import { importGraphml } from '../GraphmlParser';
import { isPlatformAvailable } from '../PlatformLoader';

type FileError = {
  name: string;
  content: string;
};

export class FilesManager {
  constructor(private editorManager: EditorModel) {}

  private get data() {
    return this.editorManager.data;
  }

  newFile(platformIdx: string) {
    if (!isPlatformAvailable(platformIdx)) {
      throw Error('unknown platform ' + platformIdx);
    }

    const elements = emptyElements();
    (elements.transitions as any) = [];
    (elements.notes as any) = [];
    elements.platform = platformIdx;
    this.editorManager.init(null, 'Без названия', elements as any);
  }

  compile() {
    Compiler.compile(this.data.elements.platform, this.data.elements);
  }

  // Теперь называется так, потому что данные не парсятся
  initImportData(importData: Elements, openData: [boolean, string | null, string | null, string]) {
    if (openData[0]) {
      try {
        if (!isPlatformAvailable(importData.platform)) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${importData.platform}".`,
          });
        }
        this.editorManager.init(
          openData[1]!.replace('.graphml', '.json'),
          openData[2]!.replace('.graphml', '.json'),
          importData
        );
        return makeRight(null);
      } catch (e) {
        let errText = 'unknown error';
        if (typeof e === 'string') {
          errText = e.toUpperCase();
        } else if (e instanceof Error) {
          errText = e.message;
        }
        console.error(e);
        return makeLeft({
          name: openData[1]!,
          content: 'Ошибка формата: ' + errText,
        });
      }
    } else if (openData[1]) {
      return makeLeft({
        name: openData[1]!,
        content: openData[3]!,
      });
    }
    return makeLeft(null);
  }

  async import(setOpenData: Dispatch<[boolean, string | null, string | null, string]>) {
    const openData = await window.api.fileHandlers.openFile('Cyberiada');
    if (openData[0]) {
      Compiler.compile(`BearlogaDefendImport-${openData[2]?.split('.')[0]}`, openData[3]);
      setOpenData(openData);
    }
  }

  async open(
    openImportError: (error: string) => void,
    path?: string
  ): Promise<Either<FileError | null, null>> {
    const openData = await window.api.fileHandlers.openFile('Cyberiada', path);
    if (openData[0]) {
      try {
        const data = importGraphml(openData[3], openImportError);
        if (data == undefined) {
          return makeLeft(null);
        }
        if (!isPlatformAvailable(data.platform)) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${data.platform}".`,
          });
        }

        this.editorManager.init(openData[1] ?? '', openData[2] ?? '', data);

        return makeRight(null);
      } catch (e) {
        let errText = 'unknown error';
        if (typeof e === 'string') {
          errText = e.toUpperCase();
        } else if (e instanceof Error) {
          errText = e.message;
        }
        return makeLeft({
          name: openData[1]!,
          content: 'Ошибка формата: ' + errText,
        });
      }
    } else if (openData[1]) {
      return makeLeft({
        name: openData[1]!,
        content: openData[3]!,
      });
    }
    return makeLeft(null);
  }

  save = async (): Promise<Either<FileError | null, null>> => {
    if (!this.data.isInitialized) return makeLeft(null);
    if (!this.data.basename) {
      return await this.saveAs();
    }
    const saveData = await window.api.fileHandlers.saveFile(
      this.data.basename,
      this.editorManager.serializer.getAll('Cyberiada')
    );
    if (saveData[0]) {
      this.editorManager.triggerSave(saveData[1], saveData[2]);
      return makeRight(null);
    } else {
      return makeLeft({
        name: saveData[1],
        content: saveData[2],
      });
    }
  };

  saveAs = async (): Promise<Either<FileError | null, null>> => {
    if (!this.data.isInitialized) return makeLeft(null);
    const data = this.editorManager.serializer.getAll('Cyberiada');
    const saveData = await window.api.fileHandlers.saveAsFile(this.data.basename as string, data);
    if (saveData[0]) {
      this.editorManager.triggerSave(saveData[1], saveData[2]);
      return makeRight(null);
    } else if (saveData[1]) {
      return makeLeft({
        name: saveData[1]!,
        content: saveData[2]!,
      });
    }
    return makeLeft(null);
  };

  saveAsScreenShot = async (element: HTMLElement) => {
    if (!this.data.isInitialized) return makeLeft(null);
    const screenshotDataUrl = await this.createScreenshot(element);

    //Берём имя файла и убираем его расширение в наименовании и меняем на расширение сохраняемого изображения
    const nameFile = this.data.basename?.replace('.graphml', '.png') as string;

    return await window.api.fileHandlers.saveAsScreenShot(nameFile, screenshotDataUrl);
  };

  private createScreenshot = async (element: HTMLElement | null): Promise<string> => {
    if (element) {
      const canvas = await html2canvas(element);
      return canvas.toDataURL('image/png');
    } else {
      throw new Error('Элемент отсутствует!');
    }
  };

  async saveIntoFolder(data: Array<SourceFile | Binary>) {
    await window.api.fileHandlers.saveIntoFolder(data);
  }

  async getAllTemplates() {
    return (await window.electron.ipcRenderer.invoke('getAllTemplates')) as TemplatesList;
  }

  async createFromTemplate(type: string, name: string, openImportError: (error: string) => void) {
    const templateData = await window.electron.ipcRenderer.invoke(
      'getTemplateData',
      type,
      name + '.graphml'
    );

    const data = importGraphml(templateData, openImportError);
    if (data == undefined) {
      return;
    }
    this.editorManager.init(null, 'Без названия', data);
    this.editorManager.makeStale();
  }
}
