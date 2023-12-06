import { Dispatch } from 'react';

import { Compiler } from '@renderer/components/Modules/Compiler';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import { emptyElements } from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';

import { EditorManager } from './EditorManager';

import ElementsJSONCodec from '../../codecs/ElementsJSONCodec';
import { importGraphml } from '../GraphmlParser';
import { isPlatformAvailable } from '../PlatformLoader';

type FileError = {
  name: string;
  content: string;
};

export class FilesManager {
  constructor(private editorManager: EditorManager) {}

  private get data() {
    return this.editorManager.data;
  }

  newFile(platformIdx: string) {
    if (!isPlatformAvailable(platformIdx)) {
      throw Error('unknown platform ' + platformIdx);
    }

    const elements = emptyElements();
    (elements.transitions as any) = [];
    elements.platform = platformIdx;
    this.editorManager.init(null, 'Без названия', elements as any);
  }

  compile() {
    Compiler.compile(this.data.elements.platform, {
      ...this.data.elements,
      transitions: Object.values(this.data.elements.transitions),
    });
  }

  parseImportData(importData, openData: [boolean, string | null, string | null, string]) {
    if (openData[0]) {
      try {
        const data = ElementsJSONCodec.toElements(importData);
        if (!isPlatformAvailable(data.platform)) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${data.platform}".`,
          });
        }
        this.editorManager.init(
          openData[1]!.replace('.graphml', '.json'),
          openData[2]!.replace('.graphml', '.json'),
          data
        );

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

  async import(setImportData: Dispatch<[boolean, string | null, string | null, string]>) {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile', 'Cyberiada');
    if (openData[0]) {
      Compiler.compile(`BearlogaDefendImport-${openData[2]?.split('.')[0]}`, openData[3]);
      setImportData(openData);
    }
  }

  async open(
    openImportError: (error: string) => void,
    path?: string
  ): Promise<Either<FileError | null, null>> {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile', 'Cyberiada', path);
    if (openData[0]) {
      try {
        const data = importGraphml(openData[3], openImportError);

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
    const saveData: [boolean, string, string] = await window.electron.ipcRenderer.invoke(
      'dialog:saveFile',
      this.data.basename,
      this.editorManager.serializer.getAll('Cyberiada')
    );
    if (saveData[0]) {
      this.data.basename = saveData[1];
      this.data.name = saveData[2];

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
    const saveData: [boolean, string | null, string | null] =
      await window.electron.ipcRenderer.invoke('dialog:saveAsFile', this.data.basename, data);
    if (saveData[0]) {
      this.data.basename = saveData[1];
      this.data.name = saveData[2];

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
    await window.electron.ipcRenderer.invoke('dialog:saveIntoFolder', data);
  }
}
