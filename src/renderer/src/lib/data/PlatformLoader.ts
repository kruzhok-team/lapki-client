import { Platform, PlatformInfo, Platforms } from '@renderer/types/platform';
import PlatformsJSONCodec from '../codecs/PlatformsJSONCodec';
import { Either, isLeft, makeLeft, makeRight, unwrapEither } from '@renderer/types/Either';
import { PlatformManager } from './PlatformManager';

// TODO? выдача стандартного файла для платформы

// TODO: забирать пути динамически или дать пользователям их редактировать
const platformPaths = ['/platform/Berloga.json', '/platform/Arduino.json'];

let platformsLoaded = false;

const platforms: Map<string, Platform> = new Map();
const platformsErrors: Map<string, string> = new Map();

function fetchPlatforms(urls: string[]) {
  const promises = urls.map((url): Promise<[string, Either<string, Platforms>]> => {
    return new Promise(async (resolve) => {
      let response = await fetch(url);

      if (!response.ok) {
        resolve([url, makeLeft('Ошибка HTTP: ' + response.status)]);
        return;
      }

      try {
        let text = await response.text();
        let data = PlatformsJSONCodec.toPlatforms(text);
        resolve([url, makeRight(data)]);
      } catch (e) {
        let errText = 'unknown error';
        if (typeof e === 'string') {
          errText = e.toUpperCase();
        } else if (e instanceof Error) {
          errText = e.message;
        }
        resolve([url, makeLeft('Ошибка формата: ' + errText)]);
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
  fetchPlatforms(platformPaths).then((results) => {
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
  return new PlatformManager(pfm);
}
