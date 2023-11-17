import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge } from 'electron';
import { FLASHER_LOCAL_HOST, LAPKI_FLASHER } from '../main/modules/ModuleManager';
import {
  COMPILER_SETTINGS_KEY,
  FLASHER_SETTINGS_KEY,
  PLATFORMS_PATH_SETTINGS_KEY,
} from '../main/electron-settings-consts';
// Custom APIs for renderer
const api = {
  LAPKI_FLASHER,
  FLASHER_LOCAL_HOST,
  FLASHER_SETTINGS_KEY,
  COMPILER_SETTINGS_KEY,
  PLATFORMS_PATH_SETTINGS_KEY,
};
console.log('COMPILER_SETTINGS', COMPILER_SETTINGS);
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
