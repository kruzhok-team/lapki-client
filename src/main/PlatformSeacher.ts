import { app } from 'electron';
import settings from 'electron-settings';

import path from 'path';

import { handleGetPlatforms } from './file-handlers';

const basePath = path.join(__dirname, '../../resources').replace('app.asar', 'app.asar.unpacked');

const DEFAULT_PATH = [basePath + '/platform', app.getPath('userData') + '/platform'];

export async function searchPlatforms() {
  return new Promise(async (resolve, _reject) => {
    const platformsPaths = new Array<string>();
    const userPath: any = await settings.get('platformsPath');
    let platformFound = false;
    if (userPath.path != '') {
      DEFAULT_PATH.push(userPath!.path);
    }
    for (const path of DEFAULT_PATH) {
      const response = await handleGetPlatforms(path);
      if (response[0]) {
        if (response[1].length > 0) {
          platformsPaths.push(...response[1]);
          platformFound = true;
        }
      }
    }
    resolve([platformFound, platformsPaths]);
  });
}
