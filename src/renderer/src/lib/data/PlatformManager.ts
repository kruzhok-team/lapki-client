import { Platform } from '@renderer/types/platform';
import PlatformsJSONCodec from '../codecs/PlatformsJSONCodec';

// TODO: забирать пути динамически или дать пользователям их редактировать
const platformPaths = ['/platform/Berloga.json', '/platform/Arduino.json'];

let platformsLoaded = false;

const platforms: Map<string, Platform> = new Map();
const platformsErrors: Map<string, string> = new Map();

function fetchPlatforms(urls: string[]) {
  const promises = urls.map((url): Promise<[string, boolean]> => {
    return new Promise(async (resolve) => {
      let response = await fetch(url);

      if (!response.ok) {
        platformsErrors.set(url, 'Ошибка HTTP: ' + response.status);
        resolve([url, false]);
        return;
      }

      let text = await response.text();

      try {
        let data = PlatformsJSONCodec.toPlatforms(text);
        Object.entries(data.platform).forEach(([key, platform]) => {
          if (platforms.has(key)) {
            const platformName = platform.name ? ` (${platform.name})` : '';
            const newErr = `Дубликат платформы ${key}${platformName}`;
            platformsErrors.set(key, platformsErrors.get(key) + '\n' + newErr);
          }
          platforms.set(key, platform);
        });
        resolve([url, true]);
      } catch (e) {
        let errText = 'unknown error';
        if (typeof e === 'string') {
          errText = e.toUpperCase();
        } else if (e instanceof Error) {
          errText = e.message;
        }
        platformsErrors.set(url, 'Ошибка формата: ' + errText);
        resolve([url, false]);
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
  fetchPlatforms(platformPaths).then((_results) => {
    platformsLoaded = true;
    callback();
  });
}

export class PlatformManager {}

/*
@privateRemarks

Менеджер платформы: 
предзагрузка файлов платформ
выдача списка платформ
инициализация платформы ()
выдача стандартного файла для платформы

выдача списка компонентов
синглтон ли компонент?
выдача списка событий для компонента
выдача списка действий для компонента
выдача списка параметров для компонента
выдача списка переменных для компонента

текущее хранилище платформа

*/
