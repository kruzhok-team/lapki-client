import settings from 'electron-settings';

import { readFile } from 'fs';
import * as http from 'http';

import { findFreePort, getUsedPorts } from './freePortFinder';

import { defaultSettings } from '../settings';
import { basePath, getContentType } from '../utils';

export async function startDocServer() {
  const usedPorts = getUsedPorts();
  const port = await findFreePort({ usedPorts });
  const host = 'localhost';
  const urlBase = `http://${host}:${port}`;
  settings.setSync('doc.localHost', urlBase);
  defaultSettings.doc.localHost = urlBase;
  http
    .createServer(function (request, response) {
      const url = new URL(`${urlBase}${request.url}`);

      let filePath = `${basePath}/docserver${decodeURI(url.pathname)}`;
      if (url.pathname === '/') filePath = filePath + 'index.json';

      const contentType = getContentType(filePath);
      if (!contentType) {
        response.writeHead(500);
        response.end(`Тип контента для ${filePath} не определён.`, 'utf-8');
        return;
      }
      readFile(filePath, function (error, content) {
        if (error) {
          if (error.code == 'ENOENT') {
            response.writeHead(404);
            response.end('Страница не найдена: 404', 'utf-8');
          } else {
            response.writeHead(500);
            response.end(
              'Произошла ошибка, отправьте код ошибки в службу поддержки: ' + error.code + ' ..\n',
              'utf-8'
            );
          }
        } else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    })
    .listen(port, host);
}
