import { Dispatch } from 'react';

import { Compiler } from '@renderer/components/Modules/Compiler';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import { Elements, emptyElements, emptyStateMachine } from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';
import { TemplatesList } from '@renderer/types/templates';

import { importGraphml } from '../GraphmlParser';
import { ModelController } from '../ModelController';
import { isPlatformAvailable } from '../PlatformLoader';

type FileError = {
  name: string;
  content: string;
};

export class FilesManager {
  constructor(private modelController: ModelController) {}

  private get data() {
    return this.modelController.model.data;
  }
  private get controller() {
    return this.modelController;
  }

  newFile(platformIdx: string) {
    if (!isPlatformAvailable(platformIdx)) {
      throw Error('unknown platform ' + platformIdx);
    }
    this.modelController.reset();
    const elements = emptyElements();
    elements.stateMachines['G'] = emptyStateMachine();
    elements.stateMachines['G'].platform = platformIdx;
    this.modelController.initData(null, 'Без названия', elements as any);

    return this.modelController.model.data.headControllerId;
    // this.modelController.model.init(null, 'Без названия', elements as any);
  }

  compile() {
    Compiler.compile(this.data.elements);
  }

  isPlatformsAvailable(importData: Elements) {
    for (const smId in importData.stateMachines) {
      const sm = importData.stateMachines[smId];
      if (!isPlatformAvailable(sm.platform)) {
        return [false, sm.platform];
      }
    }

    return [true, null];
  }

  // Теперь называется так, потому что данные не парсятся
  initImportData(importData: Elements, openData: [boolean, string | null, string | null, string]) {
    if (openData[0]) {
      try {
        const checkResult = this.isPlatformsAvailable(importData);
        if (!checkResult[0]) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${checkResult[1]}".`,
          });
        }
        this.modelController.initData(
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

  async import(
    setOpenData: Dispatch<[boolean, string | null, string | null, string]>
  ): Promise<boolean> {
    const openData = await window.api.fileHandlers.openFile('Cyberiada');
    if (openData[0]) {
      Compiler.compile(openData[3]);
      setOpenData(openData);
      return true;
    }

    return false;
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

        const checkResult = this.isPlatformsAvailable(data);
        if (!checkResult[0]) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${checkResult[2]}".`,
          });
        }
        this.modelController.initData(openData[1] ?? '', openData[2] ?? '', data);
        // this.modelController.components.fromElementsComponents(data.components);
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
    const canvas = this.controller.getCurrentCanvas();
    const isInitialized = this.data.canvas[canvas.id].isInitialized;
    if (!isInitialized) return makeLeft(null);
    if (!this.data.basename) {
      return await this.saveAs();
    }
    const saveData = await window.api.fileHandlers.saveFile(
      this.data.basename,
      this.modelController.model.serializer.getAll('Cyberiada')
    );
    if (saveData[0]) {
      this.modelController.model.triggerSave(saveData[1], saveData[2]);
      return makeRight(null);
    } else {
      return makeLeft({
        name: saveData[1],
        content: saveData[2],
      });
    }
  };

  saveAs = async (): Promise<Either<FileError | null, null>> => {
    const canvas = this.controller.getCurrentCanvas();
    const isInitialized = this.data.canvas[canvas.id].isInitialized;
    if (!isInitialized) return makeLeft(null);
    const data = this.modelController.model.serializer.getAll('Cyberiada');
    const saveData = await window.api.fileHandlers.saveAsFile(this.data.basename as string, data);
    if (saveData[0]) {
      this.modelController.model.triggerSave(saveData[1], saveData[2]);
      return makeRight(null);
    } else if (saveData[1]) {
      return makeLeft({
        name: saveData[1]!,
        content: saveData[2]!,
      });
    }
    return makeLeft(null);
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
    this.modelController.initData(null, 'Без названия', data);
    // this.modelController.model.init(null, 'Без названия', data);
  }
}
