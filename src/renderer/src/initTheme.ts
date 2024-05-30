window.electron.ipcRenderer.invoke('settings:get', 'theme').then((theme) => {
  document.documentElement.dataset.theme = theme;
});
