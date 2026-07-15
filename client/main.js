const { app, BrowserWindow, ipcMain } = require("electron");
const net = require("net");
const path = require("path");

const PORT = 3000;
const HOST = "127.0.0.1";

let mainWindow;
let client;

function criarJanela() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Segurança ativada
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  criarJanela();

  // Inicia a conexão TCP pura exigida pelo professor
  client = net.createConnection({ port: PORT, host: HOST }, () => {
    mainWindow.webContents.send(
      "msg-do-socket",
      "Conectado ao servidor WhatsCord!",
    );
  });

  // Escuta dados chegando do servidor e envia para a janela do HTML
  client.on("data", (data) => {
    const mensagem = data.toString("utf8").trim();
    mainWindow.webContents.send("msg-do-socket", mensagem);
  });

  client.on("error", (err) => {
    mainWindow.webContents.send(
      "msg-do-socket",
      `Erro de rede: ${err.message}`,
    );
  });
});

// Escuta mensagens vindas do HTML e escreve no Socket TCP
ipcMain.on("msg-do-ui", (event, texto) => {
  if (client && !client.destroyed) {
    client.write(`${texto}\n`); // Mantém o delimitador \n
  }
});
