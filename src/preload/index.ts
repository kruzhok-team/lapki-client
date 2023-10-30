import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge } from 'electron';
import { FLASHER_LOCAL_HOST, LAPKI_FLASHER } from '../main/modules/ModuleManager';
import {
  COMPILER_SETTINGS,
  PLATFORMS_PATH_SETTINGS,
  DEFAULT_COMPILER_HOST,
  DEFAULT_COMPILER_PORT,
} from '../main/electron-settings-consts';
// Custom APIs for renderer
const api = {
  FLASHER_LOCAL_HOST,
  LAPKI_FLASHER,
  COMPILER_SETTINGS,
  PLATFORMS_PATH_SETTINGS,
  DEFAULT_COMPILER_HOST,
  DEFAULT_COMPILER_PORT,
};

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
