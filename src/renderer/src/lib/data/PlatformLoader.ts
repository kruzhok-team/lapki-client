import { extendPreloadPicto, resolveImg } from '@renderer/lib/drawable';
import { Either, isLeft, makeLeft, makeRight, unwrapEither } from '@renderer/types/Either';
import { Platform, PlatformInfo, Platforms } from '@renderer/types/platform';

import { PlatformManager } from './PlatformManager';

import PlatformsJSONCodec from '../codecs/PlatformsJSONCodec';
// TODO? выдача стандартного файла для платформы

const platformPaths = await window.api.fileHandlers.getPlatforms();

let platformsLoaded = false;

const platforms: Map<string, Platform> = new Map();
const platformsErrors: Map<string, string> = new Map();

function fetchPlatforms(paths: string[]) {
  const promises = paths.map((path): Promise<[string, Either<string, Platforms>]> => {
    return new Promise(async (resolve) => {
      const response = await window.api.fileHandlers.openPlatformFile(path);

      if (!response[0]) {
        resolve([path, makeLeft('Ошибка при чтении файла:' + response[3])]);
        return;
      }

      try {
        const text = response[1] as string;
        const data = PlatformsJSONCodec.toPlatforms(text);
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
  if (platformPaths[0]) {
    fetchPlatforms(platformPaths[1]).then((results) => {
      platforms.clear();
      platformsErrors.clear();
      results.forEach(([url, eData]) => {
        if (isLeft(eData)) {
          const err = unwrapEither(eData);
          platformsErrors.set(url, err);
        } else {
          const platform = unwrapEither(eData);
          // Object.entries(data).forEach(([platform]) => {
          if (platforms.has(platform.id)) {
            const platformName = platform.name ? ` (${platform.name})` : '';
            const newErr = `Обнаружен дубликат платформы ${platform.id}${platformName}. `;
            if (platformsErrors.get(platform.id)) {
              platformsErrors.set(platform.id, platformsErrors.get(platform.id) + '\n' + newErr);
            } else {
              platformsErrors.set(platform.id, newErr);
            }
          }
          platforms.set(platform.id, platform);
          // }
          // );
        }
      });
      platformsLoaded = true;
      callback();
    });
  } else {
    console.log('Платформы не были найдены!');
    // platformsLoaded = true;
    // TODO Вывести модалку с ошибкой о том, что файлы не были загружены
  }
}

export function getPlatformsErrors(): { [url: string]: string } {
  return Object.fromEntries(platformsErrors.entries());
}

export function isPlatformAvailable(idx: string): boolean {
  return platforms.has(idx);
}

export function getAvailablePlatforms(): PlatformInfo[] {
  return Array.from(platforms.entries())
    .filter(([_idx, pfm]) => !(pfm.hidden ?? false))
    .map(([idx, pfm]) => {
      return {
        idx,
        name: pfm.name ?? idx,
        description: pfm.description ?? '',
        hidden: pfm.hidden ?? false,
      };
    });
}

export function getPlatform(idx: string) {
  return platforms.get(idx);
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
