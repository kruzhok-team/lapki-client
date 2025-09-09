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
