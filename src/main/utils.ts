import { session } from 'electron';
import { unzip } from 'unzip-crx-3';

import * as fs from 'fs';
import path from 'path';

export const basePath = path
  .join(__dirname, '../../resources')
  .replace('app.asar', 'app.asar.unpacked');

export const contentType = new Map([
  ['.html', 'text/html'],
  ['.js', 'text/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpg'],
  ['.svg', 'image/svg+xml'],
]);

export function getContentType(filepath: string) {
  try {
    return contentType.get(path.extname(filepath));
  } catch (error) {
    return null;
  }
}

export function extractPort(address: string) {
  if (!address) {
    return null;
  }
  const url = new URL(address);
  return url.port;
}

export const changePermissions = (dir: string, mode: string | number) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    fs.chmodSync(filePath, parseInt(`${mode}`, 8));
    if (fs.statSync(filePath).isDirectory()) {
      changePermissions(filePath, mode);
    }
  });
};

const unzip: any = require('unzip-crx-3'); // eslint-disable-line

/**
 * Устанавливает расширение для DevTools, если оно не установлено.
 * @param {string} extensionName - Название расширения (например, 'react-dev-tools')
 */
export async function installDevToolsExtension(extensionName: string) {
  const extensionsDir = path.resolve(__dirname, '../../extensions');
  const crxPath = path.join(extensionsDir, `${extensionName}.crx`);
  const unpackedPath = path.join(extensionsDir, extensionName);

  // Проверяем, распаковано ли расширение
  if (!fs.existsSync(unpackedPath)) {
    try {
      await unzip(crxPath, unpackedPath);
      console.log(`Extension ${extensionName} распаковано.`);
    } catch (err) {
      console.error(`Ошибка распаковки ${extensionName}:`, err);
      return;
    }
  }

  // Проверяем, установлено ли расширение
  const loadedExtensions = session.defaultSession.getAllExtensions?.() || [];
  const alreadyLoaded = loadedExtensions.some((ext: any) => ext.path === unpackedPath);
  if (!alreadyLoaded) {
    try {
      const ext = await session.defaultSession.loadExtension(unpackedPath, {
        allowFileAccess: true,
      });
      console.log(`Loaded extension: ${ext.name}`);
    } catch (err) {
      console.error(`Ошибка установки расширения ${extensionName}:`, err);
    }
  } else {
    console.log(`Extension ${extensionName} уже установлено.`);
  }
}
