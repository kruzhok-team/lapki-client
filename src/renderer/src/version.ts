/* eslint-disable no-console */
export let appVersion = null;
export const releaseName = 'EgyptianMau';

export const appName = 'Lapki IDE';
export const seriousMode = false;
export const noTextMode = false;
export const noSchemeScreen = false;
export const showDevInfo = true;

export const telegramLink = 'https://t.me/LapkiSupportBot';
export const sourceLink = 'https://github.com/kruzhok-team/lapki-client';

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
