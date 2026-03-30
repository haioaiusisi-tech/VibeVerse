const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vibeverseDesktop", {
  notify: (payload) => ipcRenderer.invoke("notify", payload)
});
