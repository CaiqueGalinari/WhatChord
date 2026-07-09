const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  enviarParaServidor: (texto) => ipcRenderer.send("msg-do-ui", texto),
  receberDoServidor: (callback) =>
    ipcRenderer.on("msg-do-socket", (event, dados) => callback(dados)),
});
