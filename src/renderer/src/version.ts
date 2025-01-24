export let appVersion = null;
export const releaseDate = '14 января 2025 года';
export const releaseName = 'Caracal';

export function initAppVersion() {
  askAppVersion().then(() => {
    // eslint-disable-next-line no-console
    console.log('😺 Lapki IDE v' + appVersion + ' «' + releaseName + '»');
  });
}

export function askAppVersion() {
  return window.electron.ipcRenderer.invoke('appVersion').then((version) => {
    appVersion = version;
  });
}
