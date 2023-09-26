import { Platform, PlatformInfo, Platforms } from '@renderer/types/platform';
import PlatformsJSONCodec from '../codecs/PlatformsJSONCodec';
import { Either, isLeft, makeLeft, makeRight, unwrapEither } from '@renderer/types/Either';
import { PlatformManager } from './PlatformManager';
import { extendPreloadPicto, resolveImg } from '../drawable/Picto';
import { Settings } from '@renderer/components/Modules/Settings';
// TODO? выдача стандартного файла для платформы

// TODO: забирать пути динамически или дать пользователям их редактировать
// const platformPaths = [
//   '/home/l140/programming/ide/client/src/renderer/public/platform/Berloga.json',
//   '/home/l140/programming/ide/client/src/renderer/public/platform/Arduino.json',
// ];

// const platformPaths = ['./platform/Berloga.json', './platform/Arduino.json'];
const platformPaths = await window.electron.ipcRenderer.invoke('PlatformLoader:getPlatforms', (await Settings.getPlatformPath()).path)

let platformsLoaded = false;

const platforms: Map<string, Platform> = new Map();
const platformsErrors: Map<string, string> = new Map();

function fetchPlatforms(paths: string[]) {
  // if (test[0]) {
  //   test[1]!.forEach(async path => {
  //     await window.electron.ipcRenderer.invoke('PlatformLoader:openPlatformFile', path);
  //   });
  // }
  const promises = paths.map((path): Promise<[string, Either<string, Platforms>]> => {
    return new Promise(async (resolve) => {
      // let response = await fetch(url);
      console.log(path)
      const response = await window.electron.ipcRenderer.invoke(
        'PlatformLoader:openPlatformFile',
        path
      );

      if (!response[0]) {
        resolve([path, makeLeft('Ошибка при чтении файла:' + response[3])]);
        return;
      }

      try {
        let text = response[1];
        let data = PlatformsJSONCodec.toPlatforms(text);
        console.log(data)
        resolve([path, makeRight(data)]);
      } catch (e) {
        let errText = 'unknown error';
        if (typeof e === 'string') {
          errText = e.toUpperCase();
        } else if (e instanceof Error) {
          errText = e.message;
        }
        resolve([path, makeLeft('Ошибка формата: ' + errText)]);
      }
    });
  });

  return Promise.all(promises);
}

export function preloadPlatforms(callback: () => void) {
  if (platformsLoaded) {
    callback();
    return;
  }
  if (platformPaths[0]){
    fetchPlatforms(platformPaths[1]).then((results) => {
      platforms.clear();
      platformsErrors.clear();
      results.forEach(([url, eData]) => {
        if (isLeft(eData)) {
          const err = unwrapEither(eData);
          platformsErrors.set(url, err);
        } else {
          const data = unwrapEither(eData);
          Object.entries(data.platform).forEach(([key, platform]) => {
            if (platforms.has(key)) {
              const platformName = platform.name ? ` (${platform.name})` : '';
              const newErr = `Обнаружен дубликат платформы ${key}${platformName}. `;
              if (platformsErrors.get(key)) {
                platformsErrors.set(key, platformsErrors.get(key) + '\n' + newErr);
              } else {
                platformsErrors.set(key, newErr);
              }
            }
            platforms.set(key, platform);
          });
        }
      });
      platformsLoaded = true;
      callback();
    });
  }
  else {
    // TODO Вывести ошибку о том, что файлы не были загружены
  }
}

export function getPlatformsErrors(): { [url: string]: string } {
  return Object.fromEntries(platformsErrors.entries());
}

export function isPlatformAvailable(idx: string): boolean {
  return platforms.has(idx);
}

export function getAvailablePlatforms(): PlatformInfo[] {
  return Array.from(platforms.entries()).map(([idx, pfm]) => {
    return {
      idx,
      name: pfm.name ?? idx,
      description: pfm.description ?? '',
    };
  });
}

export function loadPlatform(idx: string): PlatformManager | undefined {
  const pfm = platforms.get(idx);
  if (typeof pfm === 'undefined') return undefined;
  return new PlatformManager(idx, pfm);
}

export function preparePreloadImages() {
  const newImgs: { [k: string]: string } = {};
  platforms.forEach((platform) => {
    // TODO: забирать картинки из platform.parameters
    for (const cId in platform.components) {
      const component = platform.components[cId];
      // TODO: забирать картинки из component.variables
      if (component.img) {
        newImgs[component.img] = resolveImg(component.img);
      }
      for (const sId in component.signals) {
        const signal = component.signals[sId];
        if (signal.img) {
          newImgs[signal.img] = resolveImg(signal.img);
        }
      }
      for (const mId in component.methods) {
        const method = component.methods[mId];
        if (method.img) {
          newImgs[method.img] = resolveImg(method.img);
        }
      }
      for (const vId in component.variables) {
        const variable = component.variables[vId];
        if (variable.img) {
          newImgs[variable.img] = resolveImg(variable.img);
        }
      }
    }
  });
  extendPreloadPicto(newImgs);
}
