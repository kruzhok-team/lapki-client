/* eslint-disable @typescript-eslint/ban-ts-comment */
import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge } from 'electron';

import {
  COMPILER_SETTINGS_KEY,
  DEFAULT_COMPILER_SETTINGS,
  DEFAULT_DOC_SETTINGS,
  DOC_SETTINGS_KEY,
  FLASHER_SETTINGS_KEY,
  PLATFORMS_PATH_SETTINGS_KEY,
} from '../main/electron-settings-consts';
import { FLASHER_LOCAL_HOST, LAPKI_FLASHER } from '../main/modules/ModuleManager';
import { getSetting } from '../main/settings';
// Custom APIs for renderer
const api = {
  getSetting,
  LAPKI_FLASHER,
  FLASHER_LOCAL_HOST,
  FLASHER_SETTINGS_KEY,
  COMPILER_SETTINGS_KEY,
  DEFAULT_COMPILER_SETTINGS,
  PLATFORMS_PATH_SETTINGS_KEY,
  DOC_SETTINGS_KEY,
  DEFAULT_DOC_SETTINGS,
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
