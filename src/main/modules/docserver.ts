import { readFile } from 'fs';
import * as http from 'http';
import path from 'path';
// FIXME: реализовать авто поиск порта
export function startDocServer(port = 8071, host = 'localhost') {
  // FIXME: сделать функцию для получения этого пути, чтобы не дублировать код из moduleManager
  const basePath = path.join(__dirname, '../../resources').replace('app.asar', 'app.asar.unpacked');
  http
    .createServer(function (request, response) {
      const url = new URL(`http://${host}:${port}${request.url}`);

      let filePath = `${basePath}/docserver${decodeURI(url.pathname)}`;
      if (url.pathname === '/') filePath = filePath + 'index.json';

      const extname = path.extname(filePath);
      let contentType = 'text/html';
      switch (extname) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
          contentType = 'image/jpg';
          break;
        case '.wav':
          contentType = 'audio/wav';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }
      readFile(filePath, function (error, content) {
        if (error) {
          if (error.code == 'ENOENT') {
            response.writeHead(404);
            response.end('Страница не найдена: 404');
          } else {
            response.writeHead(500);
            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            response.end();
          }
        } else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    })
    .listen(port, host);
}
