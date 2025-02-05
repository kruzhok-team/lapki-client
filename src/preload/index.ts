/* eslint-disable @typescript-eslint/ban-ts-comment */
import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge } from 'electron';

import { fileHandlers } from '../main/file-handlers';

// Custom APIs for renderer
const api = { fileHandlers };

export type API = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
function safeExpose(apiKey: string, api) {
  try {
    contextBridge.exposeInMainWorld(apiKey, api);
  } catch (error) {
    console.error(error);
  }
}

if (process.contextIsolated) {
  safeExpose('electron', electronAPI);
  safeExpose('api', api);
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore (define in dts)
  window.api = api;
}
