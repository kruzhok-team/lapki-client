/* eslint-disable no-console */
export let appVersion = null;
export const releaseName = 'Caracal';

export const appName = 'Lapki IDE';
export const seriousMode = false;

export function initAppVersion() {
  askAppVersion().then(() => {
    if (seriousMode) {
      console.log('👋 ' + appName + ' v' + appVersion);
    } else {
      console.log('😸 ' + appName + ' v' + appVersion + ' «' + releaseName + '»');
    }
  });
}

export async function askAppVersion() {
  const version = await window.electron.ipcRenderer.invoke('appVersion');
  appVersion = version;
}
